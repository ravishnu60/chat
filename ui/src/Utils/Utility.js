import axios from "axios";
import Swal from "sweetalert2";
import logo from '../Assets/logo.png'
import loading_gif from '../Assets/loading1.gif'

// export const base_url = "http://192.168.1.148:8000/chat";
export const base_url = "https://chat-api-zu97.onrender.com/chat";

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
        url: `${base_url}/userinfo`,
        headers: header
    }).then((res) => {
        return res.data;
    }).catch(() => {
        navigate('/login');
    });
}

export const permission =  window.Notification?.permission;

export function requestPermission() {
    window.Notification.requestPermission(function (permission) {
        if (permission === "granted") {
            // showNotification();
        }
    });
}

navigator?.serviceWorker?.register('sw.js');

export function showNotification(title, body) {
    let icon = logo;

    let notification = new window.Notification(title, { body, icon });
    notification.onclick = () => {
        notification?.close();
        window.parent?.focus();
    }

}


export const loadingFunc = (status) => {
    if (status) {
        return (<div style={{ zIndex: 9999, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <img src={loading_gif} width={150} />
        </div>)
    }

}