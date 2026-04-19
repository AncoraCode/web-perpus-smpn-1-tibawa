import { QrCode } from 'lucide-react'

export default async function ScanPage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Scan Barcode</h1>
                <p className="text-gray-500">Scan barcode buku untuk peminjaman atau pengembalian</p>
            </div>

        </div>
    )
}