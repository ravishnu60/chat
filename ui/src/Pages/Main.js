import React, { useEffect, useState } from 'react'
import Header from '../Menus/Header'
import Home from './Home'
import Chat from './Chat'
import { loadingFunc, userstatus, isMobile, base_url, alert } from '../Utils/Utility';
import gif1 from '../Assets/hi_cat.gif'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Main() {
    const [user, setUser] = useState();
    const [to, setTo] = useState();
    const header = { "Authorization": "bearer " + sessionStorage.getItem('token') };
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [profile, setProfile] = useState()

    const getUser = async () => {
        const data = await userstatus(navigate, header);
        setUser(data?.data);
    };

    const profileChange = (e) => {
        if (e.target.files?.length) {
            var allowedExtensions = /(\.jpg|\.jpeg|\.png|)$/i;

            if (!allowedExtensions.exec(e.target.value)) {
                alert("Image files only");
                return;
            }
            if (e.target.files[0].size > 100e5) {
                alert("Large image files");
                return;
            }
            setProfile({ file: e.target.files[0]});
            document.getElementById('profile').src = URL.createObjectURL(e.target.files[0]);
        } else {
            setProfile();
        }
    }

    const uploadProfile = () => {
        const fm = new FormData();
        fm.append('source', profile?.file);
        setLoading(true);
        axios({
            method: 'put',
            url: base_url + 'user/profilepic',
            data: fm,
            headers: header
        }).then(() => {
            alert("profile updated", 'success');
            getUser();
            setTimeout(() => {
                setProfile();
            setLoading(false);
            }, 200);
        }).catch(() => {
            alert("Error, try later");
            setLoading(false);

        })
    }

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
                            <Home props={{ user, loading, setLoading, setTo, getUser }} />
                        </div>
                        <div className='col'>
                            {
                                to ? <Chat props={{ user, to, loading, setLoading, setTo }} /> :
                                    <div className='text-center h4 mt-5'>
                                        {user && <img id='profile'  
                                            className={'mb-4 '+ (user?.profile ?'profileHome':'')} 
                                            src={user?.profile} 
                                            width='120vh'
                                            title='change profile' 
                                            onClick={() => document.getElementById('profileUpload').click()}
                                            onError={() => document.getElementById(`profile`).src = gif1} />}
                                        <br />
                                        <input name='file' type='file' id='profileUpload' style={{ display: 'none' }} onChange={profileChange} />
                                        {
                                            profile?.file &&
                                            <div className='mb-3'>
                                                <button className='btn btn-success mx-3 btn-sm' onClick={uploadProfile}>Upload</button>
                                                <button className='btn btn-danger btn-sm' onClick={() => { document.getElementById('profile').src = gif1; setProfile() }}>Cancel</button>

                                            </div>
                                        }
                                        {user?.name && <span className='font-weight-bold text-info'>Welcome {user?.name} </span>}

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