import React, { useEffect, useState } from 'react'
import Header from '../Menus/Header'
import Home from './Home'
import Chat from './Chat'
import { loadingFunc, userstatus, isMobile } from '../Utils/Utility';
import gif1 from '../Assets/hi_cat.gif'
import { useNavigate } from 'react-router-dom';

function Main() {
    const [user, setUser] = useState();
    const [to, setTo] = useState();
    const header = { "Authorization": "bearer " + sessionStorage.getItem('token') };
    const [loading, setLoading] = useState(true);
    const navigate= useNavigate();

    const getUser = async () => {
        const data = await userstatus(navigate, header);
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
                {isMobile ?
                    <div className='row' style={{ height: '80vh' }}>
                        {
                            !to ?
                                <div className='col border-right'>
                                    <Home props={{ user, loading, setLoading, setTo }} />
                                </div>
                                :
                                <div className='col'>
                                    {
                                        to ? <Chat props={{ user, to, loading, setLoading, setTo }} /> :
                                            <div className='text-center h4 mt-5'>
                                                <img src={gif1} width='80vh' className='mb-4' /><br />
                                                <span className='font-weight-bold text-info'>Welcome {user?.name} </span>
                                            </div>
                                    }
                                </div>
                        }
                    </div>
                    :
                    <div className='row' style={{ height: '80vh' }}>
                        <div className='col-4 border-right'>
                            <Home props={{ user, loading, setLoading, setTo }} />
                        </div>
                        <div className='col'>
                            {
                                to ? <Chat props={{ user, to, loading, setLoading, setTo }} /> :
                                    <div className='text-center h4 mt-5'>
                                        <img src={gif1} width='80vh' className='mb-4' /><br />
                                        <span className='font-weight-bold text-info'>Welcome {user?.name} </span>
                                    </div>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

export default Main