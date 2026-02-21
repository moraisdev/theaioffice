'use client'
import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { useModal } from '@/app/hooks/useModal'
import { toast } from 'react-toastify'
import BasicInput from '../BasicInput'
import { removeExtraSpaces } from '@/utils/removeExtraSpaces'
import { apiDelete } from '@/utils/backend/requests'

type DeleteRealmModalProps = {

}

const DeleteRealmModal:React.FC<DeleteRealmModalProps> = () => {

    const { modal, realmToDelete } = useModal()
    const [loading, setLoading] = useState<boolean>(false)
    const [input, setInput] = useState<string>('')

    const onClickDelete = async () => {
        setLoading(true)

        const { error } = await apiDelete(`/api/realms/${realmToDelete.id}`)

        if (error) {
            setLoading(false)
            toast.error(error.message || 'Failed to delete realm')
        }

        if (!error) {
            window.location.reload()
        }
    }

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = removeExtraSpaces(e.target.value)
        setInput(value)
    }

    function getDisabled() {
        return input.trim() !== realmToDelete.name.trim()
    }

    useEffect(() => {
        setInput('')
    }, [modal])

    return (
        <Modal open={modal === 'Delete Realm'} closeOnOutsideClick>
            <div className='p-2 flex flex-col items-center gap-2'>
                <h1 className='text-center'>Are you sure you want to delete <span className='text-red-500 select-none'>{realmToDelete.name}</span>? It will be gone forever!</h1>
                <h2 className='text-center'>Type <span className='text-red-500 select-none'>{realmToDelete.name}</span> to confirm.</h2>
                <BasicInput className='h-8 p-2 bg-light-secondary border-none text-white' onChange={onChange} value={input}/>
                <button className={`${loading ? 'pointer-events-none' : ''} ${getDisabled() ? 'opacity-70 pointer-events-none' : ''} 'px-2 py-1 rounded-md outline-none p-2 bg-red-500 hover:bg-red-600 animate-colors text-white cursor-pointer`} disabled={getDisabled()} onClick={onClickDelete}>Delete</button>
            </div>
        </Modal>
    )
}

export default DeleteRealmModal
