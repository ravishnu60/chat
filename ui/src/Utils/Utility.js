import axios from "axios";
import Swal from "sweetalert2";
import logo from '../Assets/logo.png'
import loading_gif from '../Assets/loading-all.gif';
// import addNotification from "react-push-notification";

// export const base_url = "http://127.0.0.1:8000/";
export const base_url = "https://chat-6yfc.onrender.com/";

// export const webSocketUrl = "ws://localhost:8000/chat";
export const webSocketUrl = "wss://chat-6yfc.onrender.com/chat";

export const alert = (text, status) => {
    Swal.fire({
        text: text,
        icon: status ? 'success' : 'warning',
        showConfirmButton: false,
        timer: 1700,
        toast: true
    })
}

export const userstatus = async (navigate, header) => {
    return await axios({
        method: 'GET',
        url: `${base_url}user/userinfo`,
        headers: header
    }).then((res) => {
        return res.data;
    }).catch(() => {
        navigate('/login');
    });
}

export const permission = window.Notification?.permission;

export function requestPermission() {
    window.Notification.requestPermission(function (permission) {
        if (permission === "granted") {
            // showNotification();
        }
    });
}

navigator.serviceWorker?.register("sw.js");

export const isMobile = window.innerWidth <= 768;

export function showNotification(title, body) {
    if (permission === "granted") {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            navigator?.serviceWorker?.ready?.then((registration) => {
                // Show a notification that includes an action titled Archive.
                registration?.showNotification(title, { body: body, icon: logo })
            });
        } else {
            var notification = new Notification(title, { body: body, icon: logo });
            notification.onclick = ()=>{
                window.parent.focus()
            }
        }
    } else {
        requestPermission();
    }
}


export const loadingFunc = (status, login) => {
    
    if (status) {
        return (<div style={{ zIndex: 9999, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <img src={loading_gif}width={260} alt="Loading..." />
            {/* <div className="loadd ml-3">Loading</div> */}
        </div>)
    }

}