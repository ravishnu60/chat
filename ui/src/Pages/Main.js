import React, { useEffect, useState } from 'react'
import Header from '../Menus/Header'
import Home from './Home'
import Chat from './Chat'
import { loadingFunc, userstatus } from '../Utils/Utility';

function Main() {
    const [user, setUser] = useState();
    const [to, setTo]= useState();
    const header = { "Authorization": "bearer " + sessionStorage.getItem('token') };
    const [loading, setLoading] = useState(true);

    const getUser = async () => {
        const data = await userstatus("navigate", header);
        setLoading(false);
        setUser(data?.data);
    };

    useEffect(() => {
        getUser();
    }, [])

    return (
        <div>
            {loadingFunc(loading)}
            <Header user={user} />
            <div className='p-3'>
                <div className='row'>
                    <div className='col-4'>
                        <Home props={{user, loading, setLoading}} />
                    </div>
                    <div className='col'>
                       { 
                            to ? <Chat props={{user, to, loading, setLoading}} /> :
                            <div className='text-center h3 mt-5'>
                                Welcome {user?.name}
                            </div>
                       }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Main