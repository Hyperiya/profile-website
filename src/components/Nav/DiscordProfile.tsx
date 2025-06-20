/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/DiscordProfile.tsx
import { useState, useEffect } from 'react';
import './Styles/DiscordProfile.scss';



function DiscordProfile({data}: any) {
    const [status, setStatus] = useState('offline');
    const [activity, setActivity] = useState('Offline');
    const [statusImg, setStatusImg] = useState('/discord/offline.webp');

    function getStatusImage(data: any) {
        console.log(data.discord_status)
        const status = data.discord_status;
        switch (status) {
            case 'online': {
                setStatusImg("/discord/online.webp")
                break;
            };
            case 'idle': {
                setStatusImg("/discord/idle.webp")
                break;
            };
            case 'dnd': {
                setStatusImg("/discord/dnd.webp")
                break;
            };
            default: {
                setStatusImg("/discord/offline.webp")
                break;
            };
        }
    };

    async function getProfileStatus() {
        if (data.status) {
            setStatus(data.discord_status);
        }

        getStatusImage(data);

        switch (data.discord_status) {
            case 'online':
                setActivity("Online");
                break;
            case 'idle':
                setActivity("Idle");
                break;
            case 'dnd':
                setActivity("Do Not Disturb");
                break;
            default:
                console.log(data.discord_status)
                setActivity("Offline");
        }
    };

    useEffect(() => {
        getProfileStatus();
    }, [data]);

    return (
        <div className={`root`}>
            <div className="banner">
                <img
                    src="https://cdn.discordapp.com/banners/328275328373882880/34db0f350b050c913c778f2876304e81.webp?size=512&quality=lossless"
                    alt=""
                />
                <div className="color-banner" style={{ background: "#533b6c" }}></div>
            </div>
            <a
                href={`https://discordapp.com/users/${data?.discord_user?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="discord-link"
            >
                <div className="profile">
                    <div className="pfp">
                        <img
                            className="avatar"
                            src={`https://cdn.discordapp.com/avatars/${data?.discord_user?.id}/${data?.discord_user?.avatar}.webp?size=orig&quality=lossless`}
                            alt=""
                        />
                        <img className="avatarOnline" src={statusImg} alt={status} />
                    </div>
                    <div className="userinfo">
                        <p className="username">{data?.discord_user?.username}</p>
                        <p className="activity">{activity}</p>
                        <div className="flags"></div>
                    </div>
                </div>
            </a>
        </div>
    );
}

export default DiscordProfile;
