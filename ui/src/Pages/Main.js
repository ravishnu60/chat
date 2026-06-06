import React, { useEffect, useState } from 'react'
import Header from '../Menus/Header'
import Home from './Home'
import Chat from './Chat'
import { loadingFunc, userstatus, useIsMobile, base_url, alert } from '../Utils/Utility';
import gif1 from '../Assets/user.png';
import editing from '../Assets/image-editing.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Main() {
    const isMobile = useIsMobile();
    const [user, setUser] = useState();
    const [to, setTo] = useState();
    const header = { "Authorization": "bearer " + sessionStorage.getItem('token') };
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [profile, setProfile] = useState()
    const [profileView, setProfileView] = useState();

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
            setProfile({ file: e.target.files[0] });
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
        }).then((res) => {
            if (res.data?.status == "failed") {
                alert("Error, try later");
                setLoading(false);
                getUser();
                return;
            }
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

    const viewProfile = (link) => {
        setProfileView(link);
        document.getElementById('profileview').click();
    }

    return (
        <div className="home_bgd">
            {loadingFunc(loading)}
            <Header user={user} />
            <div className="container py-2">
                {isMobile ?
                    <div className="mobile-dashboard-container">
                        {
                            !to ?
                                <Home props={{ user, loading, setLoading, setTo, viewProfile }} />
                                :
                                <Chat props={{ user, to, loading, setLoading, setTo, viewProfile }} />
                        }
                    </div>
                    :
                    <div className="row dashboard-container">
                        <div className="col-4 chat-list-sidebar">
                            <Home props={{ user, loading, to, setLoading, setTo, getUser, viewProfile }} />
                        </div>
                        <div className="col chat-content-area">
                            {
                                to ? <Chat props={{ user, to, loading, setLoading, setTo, viewProfile }} /> :
                                    <div className="default-profile-container">
                                        <div className="profile-avatar-wrapper">
                                            {user && <img id="profile"
                                                className="profileHome"
                                                style={{ cursor: "pointer", width: "120px", height: "120px", borderRadius: "50%" }}
                                                src={user?.profile ? user?.profile : gif1}
                                                alt="profile"
                                                title="change profile"
                                                onClick={() => document.getElementById("profileUpload").click()}
                                                onError={() => { document.getElementById("profile").src = gif1; }} />}
                                        </div>
                                        <input name="file" type="file" id="profileUpload" style={{ display: "none" }} onChange={profileChange} />
                                        {
                                            profile?.file &&
                                            <div className="mb-3">
                                                <button className="profile-upload-btn mx-2 btn-sm" onClick={uploadProfile}>Upload</button>
                                                <button className="profile-cancel-btn btn-sm" onClick={() => { document.getElementById("profile").src = gif1; setProfile() }}>Cancel</button>
                                            </div>
                                        }
                                        {user?.name && <h2 className="welcome-title">Welcome back, {user?.name}</h2>}
                                        <p className="welcome-subtitle">Select a conversation from the list or enter a mobile number to start a new chat.</p>
                                    </div>
                            }
                        </div>
                    </div>
                }
            </div>

            <button data-toggle="modal" data-target="#profile_view" id="profileview" style={{ display: 'none' }}></button>

            {/* Modal */}
            <div className="modal fade" id="profile_view" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered model-lg ">
                    <div className="modal-content bg-dark">
                        <div className='model-header'>
                            <button type="button" className="close px-2" data-dismiss='modal' aria-label="Close" style={{ color: 'white' }}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body" >
                            <div style={{ overflow: 'auto' }}>
                                <img src={profileView} width={isMobile ? 350 : 760} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Main