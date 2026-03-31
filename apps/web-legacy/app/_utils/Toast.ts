import { toast } from 'react-toastify';

export const addError = (message: string) => {
    toast.error(message);
};

export const addSuccess = (message: string) => {
    toast.success(message);
};
