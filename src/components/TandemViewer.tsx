import React, { useEffect, useRef, useState, useCallback } from 'react'

interface TandemViewerProps {
  onAssetSelect: (asset: any) => void
}

interface Facility {
  twinId: string
  name: string
  description?: string
}

// Declare global Autodesk Tandem types
declare global {
  interface Window {
    Autodesk: {
      Tandem: {
        DtApp: any
        DtModel: any
      }
    }
  }
}

const TandemViewer: React.FC<TandemViewerProps> = ({ onAssetSelect }) => {
  const appRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [selectedFacility, setSelectedFacility] = useState<string>('')
  const [authToken, setAuthToken] = useState<string>('')
  
  // API base URL
  const API_BASE = 'http://localhost:3001/api'

  // Get authentication token
  const getAuthToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/token`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      return data.access_token
    } catch (err) {
      console.error('❌ Error getting auth token:', err)
      throw new Error('Failed to get authentication token. Make sure the server is running.')
    }
  }, [])

  // Get facilities list
  const getFacilities = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/facilities`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      return data
    } catch (err) {
      console.error('❌ Error getting facilities:', err)
      throw new Error('Failed to get facilities. Check server connection.')
    }
  }, [])

  // Initialize Tandem App
  const initializeApp = useCallback(async () => {
    if (!containerRef.current || !window.Autodesk?.Tandem) return

    try {
      setIsLoading(true)
      setError(null)

      // Get authentication token
      const token = await getAuthToken()
      setAuthToken(token)

      // Initialize the Tandem application
      const app = new window.Autodesk.Tandem.DtApp()
      appRef.current = app

      // Set up the application
      await app.initializeAsync(containerRef.current, {
        env: 'PROD', // or 'STGING' for staging
        authToken: token
      })

      console.log('✅ Tandem app initialized')

      // Load facilities
      const facilitiesData = await getFacilities()
      setFacilities(facilitiesData)
      
      // Set up event listeners
      app.onSelection = (selection: any) => {
        if (selection && selection.length > 0) {
          // Convert Tandem selection to our asset format
          const asset = {
            id: `tandem-${selection[0].id}`,
            name: selection[0].displayName || 'Unknown Asset',
            type: selection[0].category || 'Unknown Type',
            location: 'Tandem Facility',
            tandemId: selection[0].id,
            properties: selection[0]
          }
          onAssetSelect(asset)
        }
      }

      setIsLoading(false)

    } catch (err) {
      console.error('❌ Error initializing Tandem app:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize Tandem application')
      setIsLoading(false)
    }
  }, [getAuthToken, getFacilities, onAssetSelect])

  // Load Tandem SDK
  useEffect(() => {
    const sdkUrl = "https://cdn.autodesk.io/tandem/viewer/v1/viewer.js";
    const cssUrl = "https://cdn.autodesk.io/tandem/viewer/v1/style.css";

    // Add the CSS stylesheet
    const existingLink = document.querySelector(`link[href='${cssUrl}']`);
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      document.head.appendChild(link);
    }
    
    // If already loaded, initialize immediately
    if (window.Autodesk?.Tandem) {
      initializeApp();
      return;
    }
    // Check if script already exists
    const existingScript = document.querySelector(`script[src='${sdkUrl}']`);
    if (existingScript) {
      existingScript.addEventListener('load', initializeApp);
      return;
    }
    // Otherwise, create and append the script
    const script = document.createElement('script');
    script.src = sdkUrl;
    script.onload = () => {
      console.log('✅ Tandem SDK loaded');
      initializeApp();
    };
    script.onerror = () => {
      setError('Failed to load Autodesk Tandem SDK');
      setIsLoading(false);
    };
    document.head.appendChild(script);
    // Cleanup
    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [initializeApp]);

  // Load a specific facility
  const loadFacility = useCallback(async (facilityId: string) => {
    if (!appRef.current) return

    try {
      setIsLoading(true)
      console.log(`📍 Loading facility: ${facilityId}`)

      // Load the model for the selected facility
      const model = new window.Autodesk.Tandem.DtModel()
      await model.initializeAsync(facilityId, appRef.current)
      
      // Set the model in the app
      await appRef.current.setModelAsync(model)
      
      console.log('✅ Facility loaded successfully')
      setIsLoading(false)

    } catch (err) {
      console.error('❌ Error loading facility:', err)
      setError(`Failed to load facility: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsLoading(false)
    }
  }, [])

  // Handle facility selection
  const handleFacilityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const facilityId = event.target.value
    setSelectedFacility(facilityId)
    if (facilityId) {
      loadFacility(facilityId)
    }
  }

  // Mock assets for fallback
  const mockAssets = [
    {
      id: 'asset-001',
      name: 'HVAC Unit A-1',
      type: 'HVAC',
      location: 'Building A, Floor 1',
      position: { x: 200, y: 150 },
      status: 'Operational'
    },
    {
      id: 'asset-002',
      name: 'Fire Pump Station',
      type: 'Fire Safety',
      location: 'Building A, Basement',
      position: { x: 400, y: 300 },
      status: 'Maintenance Required'
    }
  ]

  const getAssetColor = (status: string) => {
    switch (status) {
      case 'Operational': return 'bg-green-500'
      case 'Maintenance Required': return 'bg-yellow-500'
      case 'Alert': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (error) {
    return (
      <div className="h-full bg-gray-100 relative flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-lg font-semibold mb-4">⚠️ Connection Error</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-left">
            <h4 className="font-medium text-blue-900 mb-2">Setup Required</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>1. Start the backend server: <code className="bg-blue-100 px-1 rounded">cd server && npm install && npm run dev</code></p>
              <p>2. Configure APS credentials in server/.env</p>
              <p>3. Add service account to your Tandem facility</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-100 relative">
      {/* Facility Selector */}
      {facilities.length > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <select
            value={selectedFacility}
            onChange={handleFacilityChange}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a facility...</option>
            {facilities.map((facility) => (
              <option key={facility.twinId} value={facility.twinId}>
                {facility.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tandem Viewer Container */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ display: isLoading ? 'none' : 'block' }}
      />
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Autodesk Tandem Viewer...</p>
            <p className="text-sm text-gray-500 mt-2">
              {facilities.length === 0 ? 'Connecting to server...' : 'Initializing 3D facility model'}
            </p>
          </div>
        </div>
      )}

      {/* Fallback View (when no facility selected) */}
      {!isLoading && !error && !selectedFacility && facilities.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
          <div className="text-center">
            <div className="text-gray-600 text-lg font-semibold mb-2">
              Select a facility to view in 3D
            </div>
            <p className="text-gray-500 text-sm">
              Choose a facility from the dropdown in the top-left corner
            </p>
          </div>
        </div>
      )}

      {/* Integration Status */}
      <div className="absolute top-4 right-4 bg-white border border-gray-200 p-3 rounded-lg shadow-sm max-w-xs">
        <div className="flex items-start space-x-2">
          <div className="text-green-600 mt-1">✅</div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm">Tandem Integration</h4>
            <p className="text-xs text-gray-600 mt-1">
              {isLoading 
                ? "Loading..." 
                : facilities.length > 0
                  ? `${facilities.length} facilities available`
                  : "Ready for facility data"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TandemViewer 