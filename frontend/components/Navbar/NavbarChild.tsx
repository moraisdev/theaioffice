'use client'
import React from 'react'
import { PlusCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useModal } from '@/app/hooks/useModal'
import BasicButton from '../BasicButton'

type NavbarChildProps = {
    name: string
}

export const NavbarChild:React.FC<NavbarChildProps> = ({ name }) => {

    const { setModal } = useModal()

    return (
        <div className='h-16'>
            <div className='w-full fixed bg-secondary flex flex-row items-center p-2 pl-8 justify-end sm:justify-between z-10'>
                <BasicButton onClick={() => setModal('Create Realm')} className='hidden sm:flex flex-row items-center gap-2 py-[10px]'>
                    Create Space
                    <PlusCircleIcon className='h-5'/>
                </BasicButton>
                <div className='flex flex-row items-center gap-4 py-1 px-1 select-none'>
                    <p className='text-white'>{name}</p>
                    <UserCircleIcon className='h-12 w-12 text-white' />
                </div>
            </div>
        </div>
    )
}
