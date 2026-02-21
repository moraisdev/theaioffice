'use client'
import React, { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar/Navbar'
import RealmsMenu from './RealmsMenu/RealmsMenu'
import { getUserId } from '@/utils/anonymous-user'
import { request } from '@/utils/backend/requests'

type Realm = {
    id: string
    name: string
    share_id: string
    shared?: boolean
}

export default function App() {
    const [realms, setRealms] = useState<Realm[]>([])
    const [errorMessage, setErrorMessage] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const uid = getUserId()

            const { data: ownedRealms, error } = await request('/api/realms', { ownerId: uid })
            const list: Realm[] = []

            if (ownedRealms) {
                list.push(...ownedRealms)
            }
            if (error) {
                setErrorMessage(typeof error === 'string' ? error : error.message || '')
            }

            const { data: visitedRealms } = await request(`/api/profiles/${uid}/visited-realms`)
            if (visitedRealms) {
                const shared = visitedRealms.map((r: Realm) => ({ ...r, shared: true }))
                list.push(...shared)
            }

            setRealms(list)
            setLoading(false)
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className='grid place-items-center pt-24'>
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <Navbar />
            <h1 className='text-3xl pl-4 sm:pl-8 pt-8'>Your Spaces</h1>
            <RealmsMenu realms={realms} errorMessage={errorMessage}/>
        </div>
    )
}
