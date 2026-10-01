import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { getUser, clearSession } from '../lib/auth'
import { closeSocket } from '../lib/socket'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faHouse,
    faMagnifyingGlass,
    faCalendarCheck,
    faComments,
    faRobot,
    faUser,
    faBars,
    faXmark,
    faRightFromBracket,
    faChevronRight,
    faShieldHalved
} from '@fortawesome/free-solid-svg-icons'

export default function DashboardLayout() {
    const user = getUser()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navItems = [
        {
            to: '/dashboard',
            label: 'Home',
            icon: faHouse,
            end: true
        },
        {
            to: '/dashboard/mentors',
            label: 'Find Mentor',
            icon: faMagnifyingGlass
        },
        {
            to: '/dashboard/appointments',
            label: 'Appointments',
            icon: faCalendarCheck
        },
        {
            to: '/dashboard/messages',
            label: 'Messages',
            icon: faComments
        },
        {
            to: '/dashboard/ai',
            label: 'Safi AI',
            icon: faRobot
        },
        {
            to: '/dashboard/profile',
            label: 'Profile',
            icon: faUser
        },
        ...(user?.role === 'admin'
            ? [{
                to: '/dashboard/admin',
                label: 'Admin',
                icon: faShieldHalved
            }]
            : [])
    ]

    const handleLogout = () => {
        closeSocket()
        clearSession()
        navigate('/login')
    }

    const closeMobileSidebar = () => {
        setSidebarOpen(false)
    }

    const userInitial =
        user?.name?.charAt(0)?.toUpperCase() || 'U'

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">

            {/* MOBILE HEADER */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4">

                <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
                    aria-label="Open menu"
                >
                    <FontAwesomeIcon icon={faBars} />
                </button>

                <div className="font-bold text-lg tracking-tight text-slate-900">
                    Daily
                    <span className="text-indigo-600">
                        gram
                    </span>
                </div>

                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {userInitial}
                </div>

            </header>

            {/* MOBILE OVERLAY */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={closeMobileSidebar}
                    className="md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40"
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-screen w-72
                    bg-white text-slate-800
                    border-r border-slate-200
                    flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full'
                    }
                    md:translate-x-0
                `}
            >

                {/* BRAND */}
                <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">

                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Daily
                            <span className="text-indigo-600">
                                gram
                            </span>
                        </h1>

                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                            Learn • Connect • Grow
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={closeMobileSidebar}
                        className="md:hidden w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
                        aria-label="Close menu"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>

                </div>

                {/* USER CARD */}
                <div className="px-4 py-4 border-b border-slate-100">

                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3">

                        <div className="flex items-center gap-3">

                            <div className="w-10 h-10 shrink-0 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
                                {userInitial}
                            </div>

                            <div className="min-w-0 flex-1">

                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {user?.name || 'User'}
                                </p>

                                <div className="flex items-center gap-1.5 mt-0.5">

                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />

                                    <p className="text-xs text-slate-500 capitalize truncate">
                                        {user?.role || 'user'}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto">

                    <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Workspace
                    </p>

                    <div className="space-y-1">

                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                onClick={closeMobileSidebar}
                                className={({ isActive }) => `
                                    group flex items-center gap-3
                                    px-3 py-2.5
                                    rounded-lg
                                    text-xs font-semibold
                                    transition
                                    ${
                                        isActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <span
                                            className={`
                                                w-8 h-8 rounded-md
                                                flex items-center justify-center
                                                transition
                                                ${
                                                    isActive
                                                        ? 'bg-indigo-100 text-indigo-600'
                                                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                                }
                                            `}
                                        >
                                            <FontAwesomeIcon
                                                icon={item.icon}
                                                className="text-xs"
                                            />
                                        </span>

                                        <span className="flex-1">
                                            {item.label}
                                        </span>

                                        <FontAwesomeIcon
                                            icon={faChevronRight}
                                            className={`
                                                text-[9px]
                                                transition
                                                ${
                                                    isActive
                                                        ? 'text-indigo-400'
                                                        : 'text-slate-300 group-hover:text-slate-400'
                                                }
                                            `}
                                        />
                                    </>
                                )}
                            </NavLink>
                        ))}

                    </div>

                </nav>

                {/* SECURITY INFO */}
                <div className="px-4 pb-3">

                    <div className="rounded-lg bg-emerald-50 border border-emerald-200/60 p-2.5">

                        <div className="flex items-center gap-2">

                            <FontAwesomeIcon
                                icon={faShieldHalved}
                                className="text-emerald-600 text-xs"
                            />

                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                Secure session
                            </span>

                        </div>

                        <p className="text-[10px] text-emerald-700 mt-0.5">
                            Your Dailygram session is protected.
                        </p>

                    </div>

                </div>

                {/* LOGOUT */}
                <div className="p-3 border-t border-slate-100">

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition"
                    >

                        <span className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-red-600">
                            <FontAwesomeIcon
                                icon={faRightFromBracket}
                                className="text-xs"
                            />
                        </span>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>

            {/* MAIN CONTENT */}
            <main className="md:ml-72 min-h-screen pt-16 md:pt-0 bg-slate-50">

                <div className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>

            </main>

        </div>
    )
}