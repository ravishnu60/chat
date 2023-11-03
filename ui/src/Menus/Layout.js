import React, { Suspense, useState } from 'react'
import Header from './Header'
import { Navigate, Route, Routes } from 'react-router-dom'

const Login = React.lazy(() => import('../Pages/Login.js'));
const Home = React.lazy(() => import('../Pages/Home.js'));
const Chat = React.lazy(() => import('../Pages/Chat.js'));

function Main() {
    const [refresh, setRefresh] = useState({click:false,refresh:false,hide:false})
    return (
        <div>
            <Header onClick={setRefresh} click={refresh} />
            <div className={`container-fluid mt-3 ${refresh?.hide? 'pt-2':'pt-5'}`}>
                <Suspense>
                    <Routes>
                        {/* <Route path='/login' element={<Login setRefresh={setRefresh} />} /> */}
                        <Route path='/home' element={<Home click={refresh} onClick={setRefresh} />} />
                        <Route path='/chat' element={<Chat onClick={setRefresh} />} />
                        <Route path='/*' element={<Navigate replace to='/login' />} />
                    </Routes>
                </Suspense>
            </div>
        </div>
    )
}

export default Main