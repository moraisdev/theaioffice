'use client'
import React, { useEffect, useState } from 'react'
import NotFound from '@/app/not-found'
import PlayClient from '../PlayClient'
import { getUserId, getUsername } from '@/utils/anonymous-user'
import { request, apiPut } from '@/utils/backend/requests'
import { useSearchParams, useParams } from 'next/navigation'

export default function Play() {
    const params = useParams()
    const searchParams = useSearchParams()
    const id = params.id as string
    const shareId = searchParams.get('shareId') || ''

    const [mapData, setMapData] = useState<any>(null)
    const [realmName, setRealmName] = useState('')
    const [skin, setSkin] = useState('009')
    const [notFound, setNotFound] = useState(false)
    const [notFoundMessage, setNotFoundMessage] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const uid = getUserId()
            const username = getUsername()

            // Fetch realm data
            let realmResult
            if (shareId) {
                realmResult = await request(`/api/realms/by-share/${shareId}`)
            } else {
                realmResult = await request(`/api/realms/${id}`)
            }

            if (!realmResult.data) {
                setNotFound(true)
                setNotFoundMessage(realmResult.error?.message || '')
                setLoading(false)
                return
            }

            const realm = realmResult.data

            // Check access for shared realms
            if (shareId && realm.only_owner && realm.owner_id !== uid) {
                setNotFound(true)
                setNotFoundMessage('only owner')
                setLoading(false)
                return
            }

            // Fetch profile
            const { data: profile } = await request(`/api/profiles/${uid}`)
            if (profile?.skin) {
                setSkin(profile.skin)
            }

            // Update visited realms if accessing via share link and not owner
            if (shareId && realm.owner_id !== uid) {
                apiPut(`/api/profiles/${uid}/visited-realms`, { shareId })
            }

            setMapData(realm.map_data)
            setRealmName(realm.name)
            setLoading(false)
        }

        fetchData()
    }, [])

    if (loading) {
        return <div className='w-full h-screen grid place-items-center'><p>Loading...</p></div>
    }

    if (notFound) {
        return <NotFound specialMessage={notFoundMessage} />
    }

    return (
        <PlayClient
            mapData={mapData}
            username={getUsername()}
            realmId={id}
            uid={getUserId()}
            shareId={shareId}
            initialSkin={skin}
            name={realmName}
        />
    )
}
