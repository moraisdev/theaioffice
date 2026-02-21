'use client'
import React, { useEffect, useState } from 'react'
import NotFound from '@/app/not-found'
import Editor from '../Editor'
import { getUserId } from '@/utils/anonymous-user'
import { request } from '@/utils/backend/requests'
import { useParams } from 'next/navigation'

export default function RealmEditor() {
    const params = useParams()
    const id = params.id as string

    const [realmData, setRealmData] = useState<any>(null)
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

            setRealmData(data.map_data)
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
            <Editor realmData={realmData} />
        </div>
    )
}
