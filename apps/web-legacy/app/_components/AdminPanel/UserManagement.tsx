import navTo from 'app/_utils/navTo';
import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaExchangeAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface UserForm {
    name: string;
    email: string;
    role: string;
    id?: string;
}

// type FormMode = 'none' | 'create' | 'edit' | 'delete' | 'switch';
export type UserFormAction = 'CREATE' | 'EDIT' | 'DELETE' | 'SWITCH' | 'NONE';

interface UserManagementProps {
    initialUserData?: UserForm;
    visibleActions: string[];
    selectedAction?: UserFormAction;
}

export default function UserManagement({
    initialUserData,
    visibleActions,
    selectedAction = 'NONE'
}: UserManagementProps) {
    const [userData, setUserData] = useState<UserForm>(
        initialUserData || { name: '', email: '', role: 'user' }
    );
    const [formMode, setFormMode] = useState<UserFormAction>(selectedAction);
    // Función para resetear el formulario
    const resetForm = () => {
        setUserData({ name: '', email: '', role: 'user', id: '' });
    };

    useEffect(() => {
        setFormMode(selectedAction);
    }, [selectedAction]);

    // Función para cambiar el modo del formulario
    const switchFormMode = (mode: UserFormAction) => {
        if (formMode === mode)
            mode = "NONE";
        else
            navTo("user-options");
        setFormMode(mode);
    };

    // Validación del formulario de usuario
    const validateUserForm = () => {
        if (formMode === 'DELETE' || formMode === 'SWITCH') {
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
            case 'CREATE':
                toast.success('User created successfully');
                break;
            case 'EDIT':
                toast.success('User updated successfully');
                break;
            case 'DELETE':
                toast.success('User deleted successfully');
                break;
            case 'SWITCH':
                toast.success('User switched successfully');
                break;
        }

        // Resetear el formulario después de enviar
        resetForm();
    };

    // Renderizado condicional del formulario basado en el modo
    const renderFormFields = () => {
        switch (formMode) {
            case 'CREATE':
            case 'EDIT':
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
            case 'DELETE':
            case 'SWITCH':
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
            case 'CREATE': return 'Create User';
            case 'EDIT': return 'Edit User';
            case 'DELETE': return 'Delete User';
            case 'SWITCH': return 'Switch User';
        }
    };

    return (
        <div className="form-control flex flex-col gap-2">
            <div id="user-options" className="flex flex-wrap gap-2">
                {visibleActions.includes('create-user') && (
                    <button
                        className={`btn btn-sm ${formMode === 'CREATE' ? 'btn-primary' : ''}`}
                        onClick={() => switchFormMode('CREATE')}
                    >
                        <FaPlus /> Create
                    </button>
                )}
                {visibleActions.includes('edit-user') && (
                    <button
                        className={`btn btn-sm ${formMode === 'EDIT' ? 'btn-primary' : ''}`}
                        onClick={() => switchFormMode('EDIT')}
                    >
                        <FaEdit /> Edit
                    </button>
                )}
                {visibleActions.includes('delete-user') && (
                    <button
                        className={`btn btn-sm ${formMode === 'DELETE' ? 'btn-primary' : ''}`}
                        onClick={() => switchFormMode('DELETE')}
                    >
                        <FaTrash /> Delete
                    </button>
                )}
                {visibleActions.includes('switch-user') && (
                    <button
                        className={`btn btn-sm ${formMode === 'SWITCH' ? 'btn-primary' : ''}`}
                        onClick={() => switchFormMode('SWITCH')}
                    >
                        <FaExchangeAlt /> Switch
                    </button>
                )}
            </div>

            {formMode !== 'NONE' && (
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