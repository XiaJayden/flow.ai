'use client'

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Minimize2 } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl: string;
  onTextSelection?: (text: string, position: { x: number; y: number }) => void;
  onHighlightCreate?: (highlight: {
    id: string;
    text: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
  }) => void;
  annotations?: Array<{
    id: string;
    content: string;
    position: { x: number; y: number; width: number; height: number };
    color: string;
    highlightedText: string;
  }>;
  highlights?: Array<{
    id: string;
    text: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
  }>;
}

export function PDFViewer({ 
  pdfUrl, 
  onTextSelection, 
  onHighlightCreate,
  annotations = [], 
  highlights = [] 
}: PDFViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [renderMethod, setRenderMethod] = useState<'iframe' | 'object' | 'embed'>('iframe');
  const [retryCount, setRetryCount] = useState(0);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up loading timeout and test PDF accessibility
  useEffect(() => {
    console.log('🔍 PDF Viewer Effect Triggered:', {
      isLoading,
      pdfUrl,
      renderMethod,
      retryCount,
      error
    });

    if (isLoading) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('⏰ PDF loading timeout after 6 seconds');
        console.log('🔍 Timeout details:', {
          renderMethod,
          retryCount,
          pdfUrl,
          timestamp: new Date().toISOString()
        });
        handleLoadFailure();
      }, 6000); // Reduced to 6 seconds for faster fallback
    }

    // Test if PDF is accessible
    const testPDFAccess = async () => {
      console.log('🌐 Testing PDF accessibility for:', pdfUrl);
      try {
        const response = await fetch(pdfUrl, { method: 'HEAD' });
        console.log('📡 PDF accessibility response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        });
        
        if (!response.ok) {
          console.error('❌ PDF not accessible:', response.status, response.statusText);
          handleLoadFailure();
        } else {
          console.log('✅ PDF is accessible');
        }
      } catch (error) {
        console.error('💥 Error checking PDF accessibility:', error);
        handleLoadFailure();
      }
    };

    testPDFAccess();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading, pdfUrl, renderMethod]);

  // Handle PDF loading failure with retry logic
  const handleLoadFailure = () => {
    console.log('🚨 PDF Load Failure Detected:', {
      currentMethod: renderMethod,
      retryCount,
      maxRetries: 2,
      pdfUrl
    });

    if (retryCount < 2) {
      const nextMethod = renderMethod === 'iframe' ? 'object' : 
                        renderMethod === 'object' ? 'embed' : 'iframe';
      
      console.log(`🔄 Retrying PDF load: ${renderMethod} → ${nextMethod}, attempt: ${retryCount + 1}/3`);
      
      setRetryCount(prev => prev + 1);
      setRenderMethod(nextMethod);
      setIsLoading(true);
      setError(null);
    } else {
      console.error('💀 All PDF loading methods failed after 3 attempts');
      setIsLoading(false);
      setError('Failed to load PDF after multiple attempts');
    }
  };

  // Get coordinates relative to the PDF container (accounting for zoom/rotation)
  const getPDFCoordinates = (clientX: number, clientY: number) => {
    if (!pdfContainerRef.current) return { x: 0, y: 0 };
    
    const rect = pdfContainerRef.current.getBoundingClientRect();
    // Calculate coordinates relative to the PDF container
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    
    return { x, y };
  };

  // Handle mouse down for selection start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getPDFCoordinates(e.clientX, e.clientY);
    setSelectionStart(coords);
    setSelectionEnd(coords);
    setIsSelecting(true);
    setSelectedText('');
  };

  // Handle mouse move for selection
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getPDFCoordinates(e.clientX, e.clientY);
    setSelectionEnd(coords);
  };

  // Handle mouse up for selection end
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !selectionEnd) {
      setIsSelecting(false);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Calculate selection area
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    // Only create highlight if selection area is large enough
    if (width > 10 && height > 10) {
      const highlight = {
        id: Date.now().toString(),
        text: `Selection at (${Math.round(selectionStart.x)}, ${Math.round(selectionStart.y)})`,
        startX: Math.min(selectionStart.x, selectionEnd.x),
        startY: Math.min(selectionStart.y, selectionEnd.y),
        endX: Math.max(selectionStart.x, selectionEnd.x),
        endY: Math.max(selectionStart.y, selectionEnd.y),
        color: 'bg-yellow-200' // Default highlight color
      };
      
      if (onHighlightCreate) {
        onHighlightCreate(highlight);
      }
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedText('');
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && onTextSelection) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (containerRect) {
        onTextSelection(selection.toString().trim(), {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top
        });
      }
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'chord_chart_sample.pdf';
    link.click();
  };

  const toggleFullscreen = () => {
    console.log('🎯 Fullscreen toggle clicked (user gesture detected)');
    
    if (!isFullscreen) {
      // Enter fullscreen - this is now a user gesture, so it should work
      if (containerRef.current) {
        if (containerRef.current.requestFullscreen) {
          console.log('🚀 Attempting fullscreen with user gesture...');
          
          containerRef.current.requestFullscreen().catch(err => {
            console.warn('Fullscreen request failed:', err);
            
            // Check if it's a permissions policy violation or user gesture issue
            if (err.name === 'NotAllowedError' || 
                err.message.includes('permissions policy') ||
                err.message.includes('not allowed') ||
                err.message.includes('blocked') ||
                err.message.includes('user gesture')) {
              console.warn('Fullscreen blocked - using CSS fallback');
              setIsFullscreen(true);
              setFullscreenSupported(false); // Update support status
            } else {
              console.error('Fullscreen error:', err);
              // Still try CSS fallback for other errors
              setIsFullscreen(true);
            }
          });
        } else {
          // Fallback for browsers that don't support fullscreen API
          console.log('Fullscreen API not supported - using CSS fallback');
          setIsFullscreen(true);
        }
      }
    } else {
      // Exit fullscreen
      console.log('🚪 Exiting fullscreen...');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.warn('Exit fullscreen failed:', err);
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Reset PDF viewer state
  const resetPDFViewer = () => {
    setRetryCount(0);
    setError(null);
    setIsLoading(true);
    setRenderMethod('iframe');
    setScale(1);
    setRotation(0);
  };

  // Reset on PDF URL change with cache busting
  useEffect(() => {
    console.log('🔄 PDF URL changed, resetting viewer...', pdfUrl);
    resetPDFViewer();
    
    // Add cache busting parameter to prevent stale loads
    const cacheBustUrl = `${pdfUrl}?t=${Date.now()}`;
    console.log('💾 Cache busting URL:', cacheBustUrl);
    
    // Force a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      console.log('⏰ Delayed PDF load after URL change');
      setIsLoading(true);
      setError(null);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [pdfUrl]);

  // Comprehensive browser and PDF diagnostics
  const runDiagnostics = () => {
    console.log('🔬 COMPREHENSIVE PDF DIAGNOSTICS');
    console.log('================================');
    
    // Browser info
    console.log('🌐 Browser Info:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    });

    // PDF support detection
    console.log('📄 PDF Support Detection:');
    
    // Check if browser has PDF plugin
    const hasPDFPlugin = () => {
      const plugins = Array.from(navigator.plugins || []);
      const pdfPlugins = plugins.filter(plugin => 
        plugin.name.toLowerCase().includes('pdf') || 
        plugin.description.toLowerCase().includes('pdf')
      );
      return pdfPlugins.length > 0;
    };

    console.log('  - PDF Plugins detected:', hasPDFPlugin());
    console.log('  - Available plugins:', Array.from(navigator.plugins || []).map(p => p.name));

    // Check MIME type support
    const checkMimeSupport = (mimeType: string) => {
      if (navigator.mimeTypes) {
        const mimeTypeObj = (navigator.mimeTypes as any)[mimeType];
        return mimeTypeObj && mimeTypeObj.enabledPlugin;
      }
      return false;
    };

    console.log('  - application/pdf MIME support:', checkMimeSupport('application/pdf'));

    // Check iframe capabilities
    console.log('🖼️ Iframe Capabilities:');
    const testIframe = document.createElement('iframe');
    testIframe.style.display = 'none';
    document.body.appendChild(testIframe);
    
    try {
      testIframe.src = 'about:blank';
      console.log('  - Iframe creation: ✅');
      console.log('  - Iframe src setting: ✅');
    } catch (error) {
      console.log('  - Iframe error:', error);
    } finally {
      document.body.removeChild(testIframe);
    }

    // Check PDF URL accessibility
    console.log('🔗 PDF URL Analysis:');
    console.log('  - PDF URL:', pdfUrl);
    console.log('  - Is absolute URL:', pdfUrl.startsWith('http'));
    console.log('  - Is relative URL:', pdfUrl.startsWith('/'));
    console.log('  - URL protocol:', new URL(pdfUrl, window.location.origin).protocol);

    // Check CORS and security
    console.log('🔒 Security & CORS:');
    console.log('  - Current origin:', window.location.origin);
    console.log('  - PDF origin:', new URL(pdfUrl, window.location.origin).origin);
    console.log('  - Same origin:', new URL(pdfUrl, window.location.origin).origin === window.location.origin);

    // Check if PDF is actually accessible
    fetch(pdfUrl, { method: 'HEAD' })
      .then(response => {
        console.log('📡 PDF Accessibility Test:');
        console.log('  - Status:', response.status);
        console.log('  - Status Text:', response.statusText);
        console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
        console.log('  - Content-Type:', response.headers.get('content-type'));
        console.log('  - Content-Length:', response.headers.get('content-length'));
        console.log('  - Last-Modified:', response.headers.get('last-modified'));
      })
      .catch(error => {
        console.error('❌ PDF accessibility test failed:', error);
      });

    console.log('================================');
  };

  // Run diagnostics on component mount
  useEffect(() => {
    console.log('🚀 PDF Viewer Component Mounted');
    runDiagnostics();
    
    // Force a small delay to ensure everything is ready
    const mountTimeout = setTimeout(() => {
      console.log('✅ Component mount delay completed');
      if (isLoading && !error) {
        console.log('🔄 Triggering delayed load check...');
        // Force a re-check of loading state
        setIsLoading(true);
      }
    }, 500);
    
    return () => clearTimeout(mountTimeout);
  }, []);

  // Handle page visibility changes (refresh detection)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page became visible - checking PDF state');
        console.log('🔍 Current state:', { isLoading, error, renderMethod, retryCount });
        
        // If we're in a loading state but no error, try to recover
        if (isLoading && !error && retryCount === 0) {
          console.log('🔄 Attempting recovery from visibility change...');
          setTimeout(() => {
            if (isLoading && !error) {
              console.log('⚠️ Still loading after visibility change, triggering fallback');
              handleLoadFailure();
            }
          }, 2000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLoading, error, renderMethod, retryCount]);

  // Check fullscreen support without violating user gesture requirement
  useEffect(() => {
    const checkFullscreenSupport = () => {
      console.log('🔍 Checking fullscreen support (non-intrusive)...');
      
      // Check basic API availability
      const hasFullscreenAPI = !!(
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled
      );

      // Check if we're in an iframe (which often blocks fullscreen)
      const isInIframe = window !== window.top;
      
    // Check permissions policy (without triggering API calls)
    const permissionsPolicy = (document as any).featurePolicy || (document as any).permissions;
    let fullscreenAllowed = true;
    
    if (permissionsPolicy) {
      try {
        fullscreenAllowed = permissionsPolicy.allowsFeature('fullscreen');
        console.log('🔒 Permissions policy check:', fullscreenAllowed);
      } catch (e) {
        console.warn('Could not check permissions policy:', e);
      }
    }

    // Check if we can detect the server headers
    fetch('/api/headers')
      .then(response => {
        console.log('📡 Server headers check:', {
          permissionsPolicy: response.headers.get('Permissions-Policy'),
          xFrameOptions: response.headers.get('X-Frame-Options'),
          contentType: response.headers.get('Content-Type')
        });
      })
      .catch(err => {
        console.warn('Could not check server headers:', err);
      });

      // Basic support check (without triggering user gesture requirement)
      const canFullscreen = hasFullscreenAPI && fullscreenAllowed && !isInIframe;

      console.log('🖥️ Fullscreen support analysis:', {
        hasFullscreenAPI,
        isInIframe,
        fullscreenAllowed,
        canFullscreen,
        userAgent: navigator.userAgent
      });

      setFullscreenSupported(canFullscreen);
    };

    // Run the check after a short delay
    const timeoutId = setTimeout(checkFullscreenSupport, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'} flex flex-col`}>
      {/* Minimal PDF Controls - Adobe Acrobat style */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.25}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[50px] text-center text-gray-700">
            {Math.round(scale * 100)}%
          </span>
          {isSelecting && (
            <span className="text-xs text-blue-600 font-medium">
              Selecting...
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="h-8 w-8 p-0"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant={selectionMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectionMode(!selectionMode)}
            className="h-8 px-3 text-xs"
            title={selectionMode ? 'Exit selection mode' : 'Enter selection mode'}
          >
            {selectionMode ? 'Exit Select' : 'Select Text'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className={`h-8 w-8 p-0 ${!fullscreenSupported ? 'opacity-50' : ''}`}
            title={
              isFullscreen ? 
                'Exit fullscreen' : 
                fullscreenSupported ? 
                  'Enter fullscreen' : 
                  'Fullscreen not supported - will use CSS fallback'
            }
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        <Button
            variant="ghost"
          size="sm"
          onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
          {/* Debug button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('🔍 Manual Debug Info:');
              console.log('PDF URL:', pdfUrl);
              console.log('Loading state:', isLoading);
              console.log('Error state:', error);
              console.log('Render method:', renderMethod);
              console.log('Retry count:', retryCount);
              runDiagnostics();
              window.open(pdfUrl, '_blank');
            }}
            className="h-8 w-8 p-0 text-xs"
            title={`Debug PDF loading - Method: ${renderMethod}, Retries: ${retryCount}`}
          >
            🔍
        </Button>
        </div>
      </div>

      {/* PDF Container - Clean, embedded style */}
      <div 
        ref={containerRef}
        className={`relative flex-1 overflow-auto bg-gray-50 ${isFullscreen ? 'h-screen' : 'h-[800px]'} ${selectionMode ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
        style={{
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin'
        }}
        onWheel={(e) => {
          // Allow scroll wheel to work on the container
          console.log('🖱️ Scroll wheel detected');
        }}
      >
        <div 
          ref={pdfContainerRef}
          className="relative mx-auto bg-white shadow-lg"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'top center',
            width: 'fit-content',
            minHeight: '100%',
          }}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-[600px] w-[800px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-[600px] w-[800px]">
              <div className="text-center text-red-600">
                <p className="mb-2">Error loading PDF</p>
                <p className="text-sm mb-4">{error}</p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Method: {renderMethod} | Attempt: {retryCount + 1}/3
                  </p>
                  <Button
                    onClick={() => {
                      setRetryCount(0);
                      setError(null);
                      setIsLoading(true);
                      setRenderMethod('iframe');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Retry Loading
                  </Button>
                  <div className="mt-2">
                    <Button
                      onClick={() => window.open(pdfUrl, '_blank')}
                      variant="ghost"
                      size="sm"
                    >
                      Open PDF in New Tab
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Dynamic PDF rendering based on method */}
          {renderMethod === 'iframe' && (
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}?t=${Date.now()}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0&view=FitH`}
              className="w-[800px] h-[600px] border-0"
              title="Chord Chart PDF"
              onLoad={() => {
                console.log('🎉 IFRAME onLoad triggered');
                if (loadingTimeoutRef.current) {
                  clearTimeout(loadingTimeoutRef.current);
                  loadingTimeoutRef.current = null;
                }
                setIsLoading(false);
                setError(null);
                console.log('✅ PDF loaded successfully with iframe');
              }}
              onError={(e) => {
                console.error('❌ PDF iframe loading error:', e);
                console.error('Iframe error details:', {
                  type: e.type,
                  target: e.target,
                  currentTarget: e.currentTarget
                });
                handleLoadFailure();
              }}
              onLoadStart={() => {
                console.log('🚀 IFRAME onLoadStart triggered');
              }}
              style={{
                width: '800px',
                height: '600px',
                border: 'none',
                display: 'block',
                pointerEvents: 'auto' // Allow scrolling and interaction
              }}
            />
          )}

          {renderMethod === 'object' && (
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-[800px] h-[600px] border-0"
              onLoad={() => {
                console.log('🎉 OBJECT onLoad triggered');
                if (loadingTimeoutRef.current) {
                  clearTimeout(loadingTimeoutRef.current);
                  loadingTimeoutRef.current = null;
                }
                setIsLoading(false);
                setError(null);
                console.log('✅ PDF loaded successfully with object');
              }}
              onError={(e) => {
                console.error('❌ PDF object loading error:', e);
                console.error('Object error details:', {
                  type: e.type,
                  target: e.target,
                  currentTarget: e.currentTarget
                });
                handleLoadFailure();
              }}
              style={{
                width: '800px',
                height: '600px',
                border: 'none',
                display: 'block',
                pointerEvents: 'auto'
              }}
            >
              <p>Your browser does not support PDFs. <a href={pdfUrl}>Download the PDF</a>.</p>
            </object>
          )}

          {renderMethod === 'embed' && (
            <embed
            src={pdfUrl}
              type="application/pdf"
              className="w-[800px] h-[600px] border-0"
              onLoad={() => {
                console.log('🎉 EMBED onLoad triggered');
                if (loadingTimeoutRef.current) {
                  clearTimeout(loadingTimeoutRef.current);
                  loadingTimeoutRef.current = null;
                }
              setIsLoading(false);
                setError(null);
                console.log('✅ PDF loaded successfully with embed');
              }}
              onError={(e) => {
                console.error('❌ PDF embed loading error:', e);
                console.error('Embed error details:', {
                  type: e.type,
                  target: e.target,
                  currentTarget: e.currentTarget
                });
                handleLoadFailure();
              }}
              style={{
                width: '800px',
                height: '600px',
                border: 'none',
                display: 'block',
                pointerEvents: 'auto'
              }}
            />
          )}
          
          {/* Interactive overlay for selection and highlighting - only when selecting */}
          {isSelecting && (
            <div
              className="absolute inset-0 w-[800px] h-[600px] z-10 bg-blue-100 bg-opacity-20"
              style={{
                pointerEvents: 'auto',
                cursor: 'crosshair'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              title="Release to create highlight"
            />
          )}
          
          {/* Selection trigger area - only when selection mode is enabled */}
          {selectionMode && (
            <div
              className="absolute inset-0 w-[800px] h-[600px] z-5"
              style={{
                pointerEvents: 'auto',
                cursor: 'crosshair',
                background: 'rgba(59, 130, 246, 0.05)'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              title="Click and drag to select text for highlighting"
            />
          )}
          
          {/* Selection Rectangle */}
          {isSelecting && selectionStart && selectionEnd && (
            <div
              className="absolute border-2 border-blue-400 bg-blue-200 bg-opacity-30 pointer-events-none z-20"
              style={{
                left: Math.min(selectionStart.x, selectionEnd.x),
                top: Math.min(selectionStart.y, selectionEnd.y),
                width: Math.abs(selectionEnd.x - selectionStart.x),
                height: Math.abs(selectionEnd.y - selectionStart.y),
              }}
            />
          )}
          
          {/* Highlight Overlays */}
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className={`absolute ${highlight.color} opacity-60 pointer-events-none z-10`}
              style={{
                left: highlight.startX,
                top: highlight.startY,
                width: highlight.endX - highlight.startX,
                height: highlight.endY - highlight.startY,
              }}
              title={highlight.text}
            />
          ))}
          
          {/* Render annotations overlay */}
          {annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`absolute ${annotation.color} ${annotation.color.replace('bg-', 'border-')} border-2 rounded px-2 py-1 text-xs cursor-pointer hover:opacity-80 z-10`}
              style={{
                left: annotation.position.x,
                top: annotation.position.y,
                width: annotation.position.width,
                height: annotation.position.height,
              }}
              title={annotation.content}
            >
              {annotation.highlightedText}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

