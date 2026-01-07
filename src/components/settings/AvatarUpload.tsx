import React, { useState, useEffect } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface AvatarUploadProps {
    url: string | null;
    onUpload: (url: string) => void;
    size?: number;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ url, onUpload, size = 150 }) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (url) downloadImage(url);
    }, [url]);

    const downloadImage = async (path: string) => {
        try {
            const { data, error } = await supabase.storage.from('avatars').download(path);
            if (error) {
                throw error;
            }
            const url = URL.createObjectURL(data);
            setAvatarUrl(url);
        } catch (error: any) {
            console.error('Error downloading image: ', error.message);
        }
    };

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            onUpload(filePath);

            // Optimistic update
            const objectUrl = URL.createObjectURL(file);
            setAvatarUrl(objectUrl);

            toast.success('Foto de perfil atualizada!');
        } catch (error: any) {
            toast.error('Erro ao fazer upload da imagem: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="avatar-upload-container" style={{ width: size, height: size }}>
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="avatar-image"
                    style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%' }}
                />
            ) : (
                <div
                    className="avatar-placeholder"
                    style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <User size={size * 0.5} color="#666" />
                </div>
            )}

            <div className="avatar-upload-overlay">
                <label className="upload-label" htmlFor="single">
                    {uploading ? <Loader2 className="animate-spin" /> : <Camera />}
                </label>
                <input
                    style={{
                        visibility: 'hidden',
                        position: 'absolute',
                    }}
                    type="file"
                    id="single"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                />
            </div>

            <style>{`
                .avatar-upload-container {
                    position: relative;
                    margin: 0 auto 2rem;
                }
                .avatar-upload-overlay {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    background: var(--color-gold);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                }
                .avatar-upload-overlay:hover {
                    transform: scale(1.1);
                }
                .upload-label {
                    cursor: pointer;
                    color: #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                }
            `}</style>
        </div>
    );
};

export default AvatarUpload;
