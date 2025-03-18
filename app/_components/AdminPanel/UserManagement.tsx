import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaExchangeAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface UserForm {
    name: string;
    email: string;
    role: string;
    id?: string;
}

type FormMode = 'none' | 'create' | 'edit' | 'delete' | 'switch';

interface UserManagementProps {
    initialUserData?: UserForm;
    selectedOption?: FormMode;
}

export default function UserManagement({ initialUserData, selectedOption = 'none' }: UserManagementProps) {
    const [userData, setUserData] = useState<UserForm>(
        initialUserData || { name: '', email: '', role: 'user' }
    );
    const [formMode, setFormMode] = useState<FormMode>(selectedOption);

    // Función para resetear el formulario
    const resetForm = () => {
        setUserData({ name: '', email: '', role: 'user', id: '' });
    };

    // Función para cambiar el modo del formulario
    const switchFormMode = (mode: FormMode) => {
        if (mode === formMode) {
            mode = 'none';
            // setFormMode('none');
        }
        setFormMode(mode);
        resetForm();
    };

    // Validación del formulario de usuario
    const validateUserForm = () => {
        if (formMode === 'delete' || formMode === 'switch') {
            if (!userData.id) {
                toast.error('User ID is required');
                return false;
            }
            return true;
        }

        if (!userData.name.trim()) {
            toast.error('Name is required');
            return false;
        }

        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(userData.email)) {
            toast.error('Invalid email format');
            return false;
        }
        return true;
    };

    // Manejador de envío del formulario
    const handleSubmit = () => {
        if (!validateUserForm()) return;

        switch (formMode) {
            case 'create':
                toast.success('User created successfully');
                break;
            case 'edit':
                toast.success('User updated successfully');
                break;
            case 'delete':
                toast.success('User deleted successfully');
                break;
            case 'switch':
                toast.success('User switched successfully');
                break;
        }

        // Resetear el formulario después de enviar
        resetForm();
    };

    // Renderizado condicional del formulario basado en el modo
    const renderFormFields = () => {
        switch (formMode) {
            case 'create':
            case 'edit':
                return (
                    <>
                        <input
                            id="user-name-input"
                            type="text"
                            placeholder="Name"
                            className="input input-bordered input-sm mb-2"
                            value={userData.name}
                            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            className="input input-bordered input-sm mb-2"
                            value={userData.email}
                            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        />
                        <select
                            className="select select-bordered select-sm mb-2"
                            value={userData.role}
                            onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                        >
                            <option value="user">Standard User</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </>
                );
            case 'delete':
            case 'switch':
                return (
                    <input
                        type="text"
                        placeholder="User ID"
                        className="input input-bordered input-sm mb-2"
                        value={userData.id || ''}
                        onChange={(e) => setUserData({ ...userData, id: e.target.value })}
                    />
                );
        }
    };

    // Obtener título del formulario basado en el modo
    const getFormTitle = () => {
        switch (formMode) {
            case 'create': return 'Create User';
            case 'edit': return 'Edit User';
            case 'delete': return 'Delete User';
            case 'switch': return 'Switch User';
        }
    };

    return (
        <div className="form-control flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
                <button
                    className={`btn btn-sm ${formMode === 'create' ? 'btn-primary' : ''}`}
                    onClick={() => switchFormMode('create')}
                >
                    <FaPlus /> Create
                </button>
                <button
                    className={`btn btn-sm ${formMode === 'edit' ? 'btn-primary' : ''}`}
                    onClick={() => switchFormMode('edit')}
                >
                    <FaEdit /> Edit
                </button>
                <button
                    className={`btn btn-sm ${formMode === 'delete' ? 'btn-primary' : ''}`}
                    onClick={() => switchFormMode('delete')}
                >
                    <FaTrash /> Delete
                </button>
                <button
                    className={`btn btn-sm ${formMode === 'switch' ? 'btn-primary' : ''}`}
                    onClick={() => switchFormMode('switch')}
                >
                    <FaExchangeAlt /> Switch
                </button>
            </div>

            {formMode !== 'none' && (
                <div className="card bg-base-200 p-3">
                    <h3 className="text-sm font-bold mb-2">{getFormTitle()}</h3>
                    {renderFormFields()}
                    <button className="btn btn-sm btn-success mt-2" onClick={handleSubmit}>
                        Submit
                    </button>
                </div>
            )}
        </div>
    );
}