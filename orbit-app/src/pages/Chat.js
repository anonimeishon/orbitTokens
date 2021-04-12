import React, { useEffect, useState } from 'react';
import PageTitle from '../components/common/PageTitle';
import io from 'socket.io-client';

const socket = io("/chat", {
    // withCredentials: true
});

export default function Chat() {
    const [text, setText] = useState("Empty")
    const [count, setCount] = useState(0)

    useEffect(() => {

        const restartSocket = async () => {
            try {
                if (socket.io.engine) {
                    socket.io.engine.close();
                    socket.io.engine.open();
                }
            } catch (err) {
                console.error(err.message)
            }
        }

        setTimeout(() => {
            setCount((old) => old + 1)
            restartSocket()
        }, 60000)
        console.log(count);
    }, [count])

    useEffect(() => {
        socket.on('listening', () => {
            console.log(socket)
        })
        socket.on('newHey', (data) => {
            console.log(data)
            setText(data)
        })
        socket.on('connect_error', (err) => {
            console.log('err')
        })
        socket.on('room1', (data) => {
            console.log(data)
        })


    }, [])
    return (
        <>
            <PageTitle title="Chat" />
            <p>{text}</p>
            <button style={{ "backgroundColor": "red" }} onClick={() => { socket.emit('hey', 'pan') }}> Emit bread!</button>
        </>
    )
}