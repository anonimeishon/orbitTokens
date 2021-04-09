require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwtDecode = require('jwt-decode');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser')
const dashboardData = require('./data/dashboard');
const User = require('./data/User');
const InventoryItem = require('./data/InventoryItem');
const jwt = require('express-jwt');
const jwtt = require('jsonwebtoken');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: 'http:localhost:3000'
});
const {
  createToken,
  hashPassword,
  verifyPassword
} = require('./util');


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.post('/api/authenticate', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email
    }).lean();

    if (!user) {
      return res.status(403).json({
        message: 'Wrong email or password.'
      });
    }

    const passwordValid = await verifyPassword(
      password,
      user.password
    );

    if (passwordValid) {
      const { password, bio, ...rest } = user;
      const userInfo = Object.assign({}, { ...rest });
      const refreshToken = createToken(userInfo, "8h"); // 8 hours
      const accessToken = createToken(userInfo, "900000"); //15 mins 900000ms
      const decodedRefreshToken = jwtDecode(refreshToken);
      const decodedAccessToken = jwtDecode(accessToken);

      const refreshExpiresAt = decodedRefreshToken.exp;
      const accessExpiresAt = decodedAccessToken.exp;

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true
      })
      res.cookie('accessToken', accessToken, {
        httpOnly: true
      })


      res.json({
        message: 'Authentication successful!',
        userInfo,
        refreshExpiresAt,
        accessExpiresAt
      });
    } else {
      res.status(403).json({
        message: 'Wrong email or password.'
      });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(400)
      .json({ message: 'Something went wrong.' });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    const hashedPassword = await hashPassword(
      req.body.password
    );

    const userData = {
      email: email.toLowerCase(),
      firstName,
      lastName,
      password: hashedPassword,
      role: 'admin'
    };

    const existingEmail = await User.findOne({
      email: userData.email
    }).lean();

    if (existingEmail) {
      return res
        .status(400)
        .json({ message: 'Email already exists' });
    }

    const newUser = new User(userData);
    const savedUser = await newUser.save();

    if (savedUser) {
      const refreshToken = createToken(savedUser, "8h");
      const accessToken = createToken(savedUser, "30000")

      const decodedRefreshToken = jwtDecode(refreshToken);
      const decodedAccessToken = jwtDecode(accessToken);

      const refreshExpiresAt = decodedRefreshToken.exp;
      const accessExpiresAt = decodedAccessToken.exp;

      const {
        firstName,
        lastName,
        email,
        role
      } = savedUser;

      const userInfo = {
        firstName,
        lastName,
        email,
        role
      };
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true
      })
      res.cookie('accessToken', accessToken, {
        httpOnly: true
      })

      return res.json({
        message: 'User created!',
        userInfo,
        refreshExpiresAt,
        accessExpiresAt
      });
    } else {
      return res.status(400).json({
        message: 'There was a problem creating your account'
      });
    }
  } catch (err) {
    return res.status(400).json({
      message: 'There was a problem creating your account'
    });
  }
});

///////////////////////


const checkAccessJwt = jwt({
  secret: process.env.JWT_SECRET,
  issuer: 'api.orbit',
  audience: 'api.orbit',
  getToken: req => req.cookies.accessToken
})

const checkRefreshJwt = jwt({
  secret: process.env.JWT_SECRET,
  issuer: 'api.orbit',
  audience: 'api.orbit',
  getToken: req => req.cookies.refreshToken

})



const attachUser = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: 'Authentication invalid' });
  }
  const decodedRefreshToken = jwtDecode(refreshToken);

  if (!decodedRefreshToken) {
    return res
      .status(401)
      .json({
        message:
          'There was a problem authorizing the request'
      });

  } else {
    req.user = decodedRefreshToken;
    next();
  }

}

app.use(attachUser);


app.post('/api/refresh-token', checkRefreshJwt, (req, res) => {
  try {
    const userInfo = req.body;
    const accessToken = createToken(userInfo, "900000"); //15 mins 900000
    const { exp: accessExpiresAt } = jwtDecode(accessToken);
    res.cookie('accessToken', accessToken, {
      httpOnly: true
    })
    res.json({
      message: 'Token refreshed',
      accessExpiresAt
    });

  } catch (err) {
    console.log(err)
    return res.status(401).json({ message: 'Problem refreshing token' })
  }
});




const requireAdmin = (req, res, next) => {
  const { role } = req.user;
  if (role !== 'admin') {
    return res.status(401).json({ message: 'Insufficient permissions' });
  }
  next();
}
///////////////////////////////////////

io.on('connection', (socket) => {
  console.log('a user connected');
});


app.get('/api/dashboard-data', checkAccessJwt, (req, res) => {
  return res.json(dashboardData)
});

app.patch('/api/user-role', checkAccessJwt, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['user', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res
        .status(400)
        .json({ message: 'Role not allowed' });
    }
    await User.findOneAndUpdate(
      { _id: req.user.sub },
      { role }
    );
    res.json({
      message:
        'User role updated. You must log in again for the changes to take effect.'
    });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

app.get('/api/inventory', checkAccessJwt, requireAdmin, async (req, res) => {
  try {
    const { sub } = req.user;
    const inventoryItems = await InventoryItem.find({
      user: sub
    });
    res.json(inventoryItems);
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

app.post('/api/inventory', checkAccessJwt, requireAdmin, async (req, res) => {
  try {
    const { sub } = req.user;
    const input = Object.assign({}, req.body, {
      user: sub
    })
    const inventoryItem = new InventoryItem(input);
    await inventoryItem.save();
    res.status(201).json({
      message: 'Inventory item created!',
      inventoryItem
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      message: 'There was a problem creating the item'
    });
  }
});

app.delete('/api/inventory/:id', checkAccessJwt, requireAdmin, async (req, res) => {
  try {
    const { sub } = req.user;
    const deletedItem = await InventoryItem.findOneAndDelete(
      { _id: req.params.id, user: sub }
    );
    res.status(201).json({
      message: 'Inventory item deleted!',
      deletedItem
    });
  } catch (err) {
    return res.status(400).json({
      message: 'There was a problem deleting the item.'
    });
  }
});

app.get('/api/users', checkAccessJwt, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .lean()
      .select('_id firstName lastName avatar bio');

    res.json({
      users
    });
  } catch (err) {
    return res.status(400).json({
      message: 'There was a problem getting the users'
    });
  }
});

app.get('/api/bio', async (req, res) => {
  try {
    const { sub } = req.user;
    const user = await User.findOne({
      _id: sub
    })
      .lean()
      .select('bio');

    res.json({
      bio: user.bio
    });
  } catch (err) {
    return res.status(400).json({
      message: 'There was a problem updating your bio'
    });
  }
});

app.patch('/api/bio', async (req, res) => {
  try {
    const { sub } = req.user;
    const { bio } = req.body;
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: sub
      },
      {
        bio
      },
      {
        new: true
      }
    );

    res.json({
      message: 'Bio updated!',
      bio: updatedUser.bio
    });
  } catch (err) {
    return res.status(400).json({
      message: 'There was a problem updating your bio'
    });
  }
});

app.post('/api/logout', async (req, res) => {
  try {
    res.cookie('refreshToken', 'DeLeTeD!', {
      httpOnly: true,
      expires: 0
    })
    res.cookie('accessToken', 'DeLeTeD!', {
      httpOnly: true,
      expires: 0
    })
    res.json({
      message: 'Logout successful!',
    });
  } catch (err) {
    return res.status(400).json({ message: 'There was a problem' })
  }
})
//TODO how to check for expired token when connected
//TODO how to check for expired token after a while of being connected
//  https://stackoverflow.com/questions/33316013/node-js-socket-io-get-cookie-value
// https://stackoverflow.com/questions/39271952/parsing-cookies-with-socket-io/45409633

const chatNamespace = io.of('/chat');

// chatNamespace.use(checkRefreshJwt)

const disconnectOnExpiredToken = (token, socket) => {
  console.log(token)
}

chatNamespace.use((socket, next) => {
  const token = socket.handshake.headers.cookie.slice(310, 593);
  // console.log(token)
  try {
    jwtt.verify(token, process.env.JWT_SECRET);
    next()
  } catch (err) {
    console.log(err.message)
    res.status(401).json({ message: 'Invalid token' })
  }
})

chatNamespace.on("connection", (socket) => {
  console.log('a user connected to chat')
  /*
Se desconecta el socket luego de 15 mins,
Del lado del cliente se debe renovar al conexion cada 10-14mins
*/
  setTimeout(() => { socket.disconnect() }, 900000)
  socket.on('hey', (data) => {
    // console.log(socket.handshake.headers.cookie)
    // socket.disconnect()
    socket.broadcast.emit('newHey', data)
  })
  socket.on('disconnect', (reason) => {
    console.log('A user disconnected from chat because of', reason);
  })


})







io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', (reason) => {
    console.log('A user disconnected ', reason);
  });
});

async function connect() {
  try {
    mongoose.Promise = global.Promise;
    await mongoose.connect(process.env.ATLAS_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });
  } catch (err) {
    console.log('Mongoose error', err);
  }
  server.listen(3001);
  console.log('API listening on localhost:3001');
}
// http.listen(3002, () => {
//   console.log('listening on *:3002');
// });
connect();