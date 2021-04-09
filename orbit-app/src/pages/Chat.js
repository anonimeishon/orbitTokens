import React, { useEffect, useState } from 'react';
import PageTitle from '../components/common/PageTitle';
import io from 'socket.io-client';

const socket = io("/chat", {
    // widhCredentials: true
});
const emitBread = () => {
    console.log('bread')



}
export default function Chat() {
    const [text, setText] = useState("Empty")

    useEffect(() => {
        //   if(socket){

        //   }
        setTimeout(() => {
            if (socket.io.engine) {
                //TODO this ends the connection after 5 seconds, i have to find a way to restart the connection
                socket.io.engine.close();
                //TODO this starts a new connection, have to manage this to be able to start a new connection every 10 minutes
                socket.io.engine.open();
                console.log(socket.io.engine)
            }
        }, 600000)
        //TODO just doing it every render of the page
    }, [])

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