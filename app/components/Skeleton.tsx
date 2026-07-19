import React from 'react'

export function SkeletonPulse({ className }: { className?: string }) {
    return <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
}

export function DashboardHomeSkeleton() {
    return (
        <div className="px-4 py-6 space-y-6">
            {/* Welcome Section */}
            <div className="space-y-2">
                <SkeletonPulse className="h-6 w-48" />
                <SkeletonPulse className="h-4 w-64" />
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 gap-3">
                <SkeletonPulse className="h-24 rounded-2xl" />
                <SkeletonPulse className="h-24 rounded-2xl" />
                <SkeletonPulse className="h-24 rounded-2xl" />
                <SkeletonPulse className="h-24 rounded-2xl" />
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
                <SkeletonPulse className="h-5 w-32" />
                <div className="grid grid-cols-3 gap-3">
                    <SkeletonPulse className="h-20 rounded-2xl" />
                    <SkeletonPulse className="h-20 rounded-2xl" />
                    <SkeletonPulse className="h-20 rounded-2xl" />
                </div>
            </div>

            {/* Recent Section */}
            <div className="space-y-3">
                <div className="flex justify-between">
                    <SkeletonPulse className="h-5 w-40" />
                    <SkeletonPulse className="h-5 w-16" />
                </div>
                <div className="space-y-3">
                    <SkeletonPulse className="h-16 rounded-xl" />
                    <SkeletonPulse className="h-16 rounded-xl" />
                    <SkeletonPulse className="h-16 rounded-xl" />
                </div>
            </div>
        </div>
    )
}

export function ListSkeleton({ title, subtitle }: { title?: string; subtitle?: string }) {
    return (
        <div className="px-4 py-6 space-y-5">
            {/* Header */}
            <div className="space-y-0.5">
                {title ? (
                    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                ) : (
                    <SkeletonPulse className="h-7 w-36" />
                )}
                {subtitle ? (
                    <p className="text-sm text-gray-500">{subtitle}</p>
                ) : (
                    <SkeletonPulse className="h-4 w-52" />
                )}
            </div>

            {/* Stats Card */}
            <SkeletonPulse className="h-20 rounded-2xl w-full" />

            {/* Search Input */}
            <SkeletonPulse className="h-11 rounded-xl w-full" />

            {/* Add Button */}
            <SkeletonPulse className="h-12 rounded-xl w-full" />

            {/* List */}
            <div className="space-y-3">
                <SkeletonPulse className="h-5 w-28" />
                <div className="space-y-3">
                    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <SkeletonPulse className="w-10 h-10 rounded-xl flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                                <SkeletonPulse className="h-4 w-1/3" />
                                <SkeletonPulse className="h-3 w-2/3" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <SkeletonPulse className="w-10 h-10 rounded-xl flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                                <SkeletonPulse className="h-4 w-1/4" />
                                <SkeletonPulse className="h-3 w-1/2" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <SkeletonPulse className="w-10 h-10 rounded-xl flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                                <SkeletonPulse className="h-4 w-1/2" />
                                <SkeletonPulse className="h-3 w-3/4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function FormSkeleton({ title, subtitle }: { title?: string; subtitle?: string }) {
    return (
        <div className="container mx-auto px-4 py-6 max-w-xl space-y-6">
            {/* Header */}
            <div className="space-y-2">
                {title ? (
                    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                ) : (
                    <SkeletonPulse className="h-7 w-40" />
                )}
                {subtitle ? (
                    <p className="text-sm text-gray-500">{subtitle}</p>
                ) : (
                    <SkeletonPulse className="h-4 w-60" />
                )}
            </div>

            {/* Media Upload Box */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                <SkeletonPulse className="h-4 w-32 pb-2" />
                <div className="flex items-center gap-4">
                    <SkeletonPulse className="w-20 h-20 rounded-2xl flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                        <SkeletonPulse className="h-4 w-24" />
                        <SkeletonPulse className="h-8 w-28 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Form Fields Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                <SkeletonPulse className="h-4 w-36 pb-2" />
                <div className="space-y-4">
                    <div className="space-y-2">
                        <SkeletonPulse className="h-3.5 w-24" />
                        <SkeletonPulse className="h-10 rounded-lg w-full" />
                    </div>
                    <div className="space-y-2">
                        <SkeletonPulse className="h-3.5 w-32" />
                        <SkeletonPulse className="h-10 rounded-lg w-full" />
                    </div>
                    <div className="space-y-2">
                        <SkeletonPulse className="h-3.5 w-28" />
                        <SkeletonPulse className="h-20 rounded-lg w-full" />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <SkeletonPulse className="h-12 rounded-xl w-full" />
        </div>
    )
}
