'use client'
import React, { useState, useEffect } from 'react'
import { NavbarChild } from './NavbarChild'
import { getUsername } from '@/utils/anonymous-user'

export const Navbar:React.FC = () => {
    const [name, setName] = useState('')

    useEffect(() => {
        setName(getUsername())
    }, [])

    return (
        <NavbarChild name={name} />
    )
}
