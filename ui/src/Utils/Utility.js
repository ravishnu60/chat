import axios from "axios";
import Swal from "sweetalert2";

export const base_url = "http://localhost:8000/chat"

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