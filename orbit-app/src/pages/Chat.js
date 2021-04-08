import React, { useEffect } from 'react';
import PageTitle from '../components/common/PageTitle';
import io from 'socket.io-client';

const socket = io('/')


export default function Chat() {
    useEffect(() => {
        socket.on('listening', ({ editorId, ops }) => {
            console.log(socket)
        })
    }, [])
    return (
        <>
            <PageTitle title="Chat" />
        </>
    )
}