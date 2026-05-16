'use client'

import { X, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    isAlert?: boolean;
    confirmation?: {
        negativeBtn: string;
        positiveBtn: string;
        handlePositiveBtn: () => void;
        loading?: {
            text: string;
            isLoading: boolean;
            setIsLoading: (val: boolean) => void;
        }
    } | null;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({
    isOpen,
    isAlert = false,
    confirmation = null,
    onClose,
    title,
    children,
}: ModalProps) {
    // Pastikan portal hanya di-render di client (hindari SSR mismatch)
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    // Cegah scroll body saat modal terbuka
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    const shouldRender = isAlert ? isOpen != null : isOpen
    if (!shouldRender || !mounted) return null

    const modalContent = (
        // Portal langsung ke body — backdrop dijamin full screen tanpa clipping
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop — full viewport */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal box */}
            <div
                className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md flex flex-col"
                style={{ maxHeight: 'calc(100dvh - 2rem)' }}
            >
                {/* Header */}
                <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content — scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4 text-gray-600 min-h-0">
                    {children}
                </div>

                {/* Footer buttons — selalu terlihat */}
                {confirmation && (
                    <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4">
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={confirmation?.loading?.isLoading}
                                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {confirmation.negativeBtn}
                            </button>
                            <button
                                onClick={() => {
                                    confirmation.handlePositiveBtn()
                                    if (!confirmation?.loading) {
                                        onClose()
                                    }
                                }}
                                disabled={confirmation?.loading?.isLoading}
                                className="px-4 py-2 flex gap-2 items-center justify-center text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {confirmation?.loading?.isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {confirmation.loading.text}
                                    </>
                                ) : (
                                    confirmation.positiveBtn
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    // Render langsung ke document.body lewat portal
    return createPortal(modalContent, document.body)
}