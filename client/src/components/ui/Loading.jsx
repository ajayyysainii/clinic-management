

export const Loading = () => (
        <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
            <div className="flex items-center justify-center h-screen">
                <div className="flex space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <div className="text-gray-500">Loading ...</div>
                </div>
            </div>
        </div>
    );