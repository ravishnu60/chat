import React, { Suspense, useState } from 'react'
import Header from './Header'
import { Route, Routes } from 'react-router-dom'

const Login = React.lazy(() => import('../Pages/Login.js'));
const Home = React.lazy(() => import('../Pages/Home.js'));
const Chat = React.lazy(() => import('../Pages/Chat.js'));

function Main() {
    const [refresh, setRefresh] = useState(1)
    return (
        <div>
            <Header loader={refresh} />
            <div className=' container-fluid mt-5 py-5'>
                <Suspense>
                    <Routes>
                        <Route path='/login' element={<Login setRefresh={setRefresh} />} />
                        <Route path='/home' element={<Home />} />
                        <Route path='/chat' element={<Chat />} />
                    </Routes>
                </Suspense>
            </div>
        </div>
    )
}

export default Main