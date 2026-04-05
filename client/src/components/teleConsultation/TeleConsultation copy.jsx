import React, {useState}  from 'react'
import { log } from './utils'
import {startBasicCall, leaveCall} from './Agora_RTC'

export default function DoctorTeleConsultation() {

  const [appid, setAppid] = useState('')
  const [channel, setChannel] = useState('')
  const [token, setToken] = useState('')
  const [isjoin, setIsJoin] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  

  const bindInputAppid = (event) => {
    setAppid(event.target.value)
    // Clear error when user starts typing
    if (errors.appid) {
      setErrors(prev => ({ ...prev, appid: '' }))
    }
  }

  const bindInputToken = (event) => {
    setToken(event.target.value)
    if (errors.token) {
      setErrors(prev => ({ ...prev, token: '' }))
    }
  }

  const bindInputChannel = (event) => {
    setChannel(event.target.value)
    if (errors.channel) {
      setErrors(prev => ({ ...prev, channel: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!appid.trim()) {
      newErrors.appid = 'AppID is required'
    } else if (appid.trim().length < 10) {
      newErrors.appid = 'AppID must be at least 10 characters'
    }
    
    if (!token.trim()) {
      newErrors.token = 'Token is required'
    } else if (token.trim().length < 20) {
      newErrors.token = 'Token must be at least 20 characters'
    }
    
    if (!channel.trim()) {
      newErrors.channel = 'Channel name is required'
    } else if (channel.trim().length < 3) {
      newErrors.channel = 'Channel name must be at least 3 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleClickJoin = async () => {
    try {
      // Clear previous connection errors
      setConnectionError('')
      
      // Validate form
      if (!validateForm()) {
        return
      }

      setIsLoading(true)

      let options = {
        appId: appid.trim(),
        channel: channel.trim(),
        token: token.trim(),
      }

      // Attempt to start the call
      await startBasicCall(options)
      
      log('join channel success')
      setIsJoin(true)
      setIsLoading(false)
      
    } catch (error) {
      console.error('Error joining call:', error)
      setConnectionError(error.message || 'Failed to join the call. Please check your credentials and try again.')
      setIsLoading(false)
    }
  }

  const handleClickLeave = async () => {
    try {
      setIsLoading(true)
      
      await leaveCall()
      log('client leaves channel success')
      setIsJoin(false)
      setConnectionError('')
      setIsLoading(false)
      
    } catch (error) {
      console.error('Error leaving call:', error)
      setConnectionError('Failed to leave the call properly. Please refresh the page if needed.')
      setIsLoading(false)
    }
  }

  const handleClearErrors = () => {
    setErrors({})
    setConnectionError('')
  }

  return (
    <div className='max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg'>
      <div className='flex justify-between items-center mb-6 pb-4 border-b border-gray-200'>
        <span className='text-2xl font-semibold text-gray-800'>Agora Basic Video Call</span>
        <a href="https://github.com/AgoraIO/Basic-Video-Call/tree/master/One-to-One-Video/Agora-Web-Tutorial-1to1-React-NG" className="text-blue-600 hover:text-blue-800 transition-colors">
          <span className="text-sm">GitHub</span>
        </a>
      </div>

      {/* Error Display */}
      {connectionError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">Connection Error</span>
            </div>
            <button 
              onClick={handleClearErrors}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Dismiss
            </button>
          </div>
          <p className="text-red-700 mt-1 text-sm">{connectionError}</p>
        </div>
      )}

      <div className='space-y-6'>
        <div>
          <span className='block text-sm font-medium text-gray-700 mb-2'>AppID</span>
          <div className='w-full'>
            <input 
              placeholder="Enter Appid" 
              value={appid} 
              onChange={bindInputAppid}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.appid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
            />
            {errors.appid && (
              <p className="text-red-600 text-sm mt-1">{errors.appid}</p>
            )}
          </div>
        </div>
        <div>
          <span className='block text-sm font-medium text-gray-700 mb-2'>Token</span>
          <div className='w-full'>
            <input 
              placeholder="Enter Token" 
              value={token} 
              onChange={bindInputToken}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.token ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
            />
            {errors.token && (
              <p className="text-red-600 text-sm mt-1">{errors.token}</p>
            )}
          </div>
        </div>
        <div>
          <span className='block text-sm font-medium text-gray-700 mb-2'>Channel</span>
          <div className='w-full'>
            <input 
              placeholder="Enter Channel Name" 
              value={channel} 
              onChange={bindInputChannel}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.channel ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
            />
            {errors.channel && (
              <p className="text-red-600 text-sm mt-1">{errors.channel}</p>
            )}
          </div>
        </div>
        <div className='flex gap-4 justify-center'>
          <div>
            <button 
              onClick={handleClickJoin} 
              disabled={isjoin || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading && !isjoin ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </>
              ) : (
                'Join'
              )}
            </button>
          </div>
          <div>
            <button 
              onClick={handleClickLeave} 
              disabled={!isjoin || isLoading}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading && isjoin ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Leaving...
                </>
              ) : (
                'Leave'
              )}
            </button>
          </div>
        </div>
      </div>
      <div className='mt-8 bg-gray-100 rounded-lg p-4 min-h-[300px] flex items-center justify-center'>
        <div id='video-agora-local' className="w-full h-full"></div>
      </div>
    </div>
  )
}