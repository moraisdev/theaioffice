'use client'
import React, { useEffect, useState } from 'react'
import ManageChild from '../ManageChild'
import NotFound from '../../not-found'
import { request } from '@/utils/backend/requests'
import { useParams } from 'next/navigation'

export default function Manage() {
    const params = useParams()
    const id = params.id as string

    const [realm, setRealm] = useState<any>(null)
    const [notFound, setNotFound] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const { data, error } = await request(`/api/realms/${id}`)

            if (!data) {
                setNotFound(true)
                setLoading(false)
                return
            }

            setRealm(data)
            setLoading(false)
        }

        fetchData()
    }, [])

    if (loading) {
        return <div className='w-full h-screen grid place-items-center'><p>Loading...</p></div>
    }

    if (notFound) {
        return <NotFound />
    }

    return (
        <div>
            <ManageChild
                realmId={realm.id}
                startingShareId={realm.share_id}
                startingOnlyOwner={realm.only_owner}
                startingName={realm.name}
            />
        </div>
    )
}
