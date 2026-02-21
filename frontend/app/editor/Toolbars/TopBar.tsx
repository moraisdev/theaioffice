'use client'
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import BasicButton from '@/components/BasicButton'
import signal from '@/utils/signal'
import { useModal } from '@/app/hooks/useModal'
import { RealmData } from '@/utils/pixi/types'
import { useParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { FloppyDisk } from '@phosphor-icons/react'
import { apiPut } from '@/utils/backend/requests'
import { RealmDataSchema } from '@/utils/pixi/zod'
import { formatForComparison, removeExtraSpaces } from '@/utils/removeExtraSpaces'

type TopBarProps = {

}

const TopBar:React.FC<TopBarProps> = () => {

    const { setLoadingText, setModal } = useModal()
    const { id } = useParams()

    const [barWidth, setBarWidth] = useState<number>(0)

    function beginSave() {
        signal.emit('beginSave')
        setModal('Loading')
        setLoadingText('Saving...')
    }

    useEffect(() => {
        const save = async (realmData: RealmData) => {
            // Client-side validation (previously done in server action)
            const result = RealmDataSchema.safeParse(realmData)
            if (!result.success) {
                toast.error('Invalid realm data.')
                setModal('None')
                signal.emit('saved')
                return
            }

            if (realmData.rooms.length === 0) {
                toast.error('A realm must have at least one room.')
                setModal('None')
                signal.emit('saved')
                return
            }

            if (realmData.rooms.length > 50) {
                toast.error('A realm cannot have more than 50 rooms.')
                setModal('None')
                signal.emit('saved')
                return
            }

            const roomNames = new Set<string>()
            for (const room of realmData.rooms) {
                if (Object.keys(room.tilemap).length > 10_000) {
                    toast.error('This room is too big to save!')
                    setModal('None')
                    signal.emit('saved')
                    return
                }

                const roomName = formatForComparison(room.name)

                if (roomNames.has(roomName)) {
                    toast.error('Room names must be unique.')
                    setModal('None')
                    signal.emit('saved')
                    return
                }
                if (roomName.trim() === '') {
                    toast.error('Room name cannot be empty.')
                    setModal('None')
                    signal.emit('saved')
                    return
                }
                if (roomName.length > 32) {
                    toast.error('Room names cannot be longer than 32 characters.')
                    setModal('None')
                    signal.emit('saved')
                    return
                }
                roomNames.add(roomName)

                room.name = removeExtraSpaces(room.name, true)
            }

            const { error } = await apiPut(`/api/realms/${id}`, { map_data: realmData })

            if (error) {
                toast.error(error.message || 'Failed to save')
            } else {
                toast.success('Saved!')
            }

            setModal('None')
            signal.emit('saved')
        }

        const onBarWidth = (width: number) => {
            setBarWidth(width)
        }

        signal.on('save', save)
        signal.on('barWidth', onBarWidth)

        return () => {
            signal.off('save', save)
            signal.off('barWidth', onBarWidth)
        }
    }, [])

    function getBgColor() {
        if (barWidth < 0.7) {
            return 'bg-quaternary'
        } else if (barWidth < 0.9) {
            return 'bg-orange-400'
        } else {
            return 'bg-red-500'
        }
    }

    return (
        <div className='w-full h-[48px] bg-secondary flex flex-row items-center p-2 border-b-2 border-black gap-2 relative'>
            <div className='hover:bg-light-secondary animate-colors aspect-square grid place-items-center rounded-lg p-1'>
                <Link href={'/app'}>
                    <ArrowLeftEndOnRectangleIcon className='h-8 w-8 text-white'/>
                </Link>
            </div>
            <BasicButton onClick={beginSave} className='flex flex-row gap-2 items-center py-0 px-[8px] h-full '>
                Save
                <FloppyDisk className='h-6 w-6'/>
            </BasicButton>
            <p className='text-xs italic'>Saving will kick any players that are online.</p>
            <div className='absolute right-12 xl:right-[475px] hidden lg:flex flex-row gap-2 items-center'>
                {barWidth > 0.9 && <p className='text-xs italic text-red-500'>{barWidth >= 1 ? "You're out of space!" : "You're running out of space!"}</p>}
                <div className='w-80 h-[12px] rounded-md border-white border-[1px] overflow-hidden'>
                    <div className={`${getBgColor()} h-full`} style={{
                        width: barWidth * 100 + '%'
                    }}/>
                </div>
            </div>
        </div>
    )
}

export default TopBar
