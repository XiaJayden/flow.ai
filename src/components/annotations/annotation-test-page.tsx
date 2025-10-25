'use client'

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Mic, 
  MicOff, 
  MessageSquare, 
  Palette, 
  Trash2,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { PDFViewer } from './pdf-viewer';

interface Annotation {
  id: string;
  type: 'text' | 'audio';
  content: string;
  audioUrl?: string;
  color: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  highlightedText?: string;
}

interface Highlight {
  id: string;
  text: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  author: {
    name: string;
  };
  createdAt: Date;
}

const MOCK_ANNOTATIONS: Annotation[] = [
  {
    id: '1',
    type: 'text',
    content: 'This chord progression needs work - the transition from Am to F is too abrupt',
    color: 'bg-red-200',
    position: { x: 100, y: 150, width: 200, height: 30 },
    author: { name: 'Sarah Johnson' },
    createdAt: new Date('2024-01-15T10:30:00'),
    highlightedText: 'Am - F - C - G'
  },
  {
    id: '2',
    type: 'audio',
    content: 'Listen to this section - the timing is off',
    audioUrl: '/audio/sample-annotation.mp3',
    color: 'bg-yellow-200',
    position: { x: 300, y: 200, width: 150, height: 25 },
    author: { name: 'Mike Chen' },
    createdAt: new Date('2024-01-15T11:15:00'),
    highlightedText: 'Verse 1'
  },
  {
    id: '3',
    type: 'text',
    content: 'Great job on the bridge! Maybe add a slight ritardando here',
    color: 'bg-green-200',
    position: { x: 200, y: 300, width: 180, height: 35 },
    author: { name: 'Emma Davis' },
    createdAt: new Date('2024-01-15T14:20:00'),
    highlightedText: 'Bridge section'
  }
];

const MOCK_HIGHLIGHTS: Highlight[] = [
  {
    id: 'h1',
    text: 'Am - F - C - G',
    startX: 100,
    startY: 150,
    endX: 300,
    endY: 180,
    color: 'bg-yellow-200',
    author: { name: 'Sarah Johnson' },
    createdAt: new Date('2024-01-15T10:30:00')
  },
  {
    id: 'h2',
    text: 'Verse 1',
    startX: 300,
    startY: 200,
    endX: 450,
    endY: 225,
    color: 'bg-blue-200',
    author: { name: 'Mike Chen' },
    createdAt: new Date('2024-01-15T11:15:00')
  }
];

const HIGHLIGHT_COLORS = [
  { name: 'Red', class: 'bg-red-200', border: 'border-red-300' },
  { name: 'Yellow', class: 'bg-yellow-200', border: 'border-yellow-300' },
  { name: 'Green', class: 'bg-green-200', border: 'border-green-300' },
  { name: 'Blue', class: 'bg-blue-200', border: 'border-blue-300' },
  { name: 'Purple', class: 'bg-purple-200', border: 'border-purple-300' }
];

export function AnnotationTestPage() {
  const [annotations, setAnnotations] = useState<Annotation[]>(MOCK_ANNOTATIONS);
  const [highlights, setHighlights] = useState<Highlight[]>(MOCK_HIGHLIGHTS);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Handle text selection from PDF
  const handleTextSelection = (text: string, position: { x: number; y: number }) => {
    setSelectedText(text);
    setSelectionPosition(position);
    setShowAnnotationForm(true);
  };

  // Handle highlight creation
  const handleHighlightCreate = (highlight: {
    id: string;
    text: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
  }) => {
    const newHighlight: Highlight = {
      ...highlight,
      color: selectedColor.class,
      author: { name: 'Current User' },
      createdAt: new Date()
    };
    
    setHighlights(prev => [...prev, newHighlight]);
  };

  // Delete highlight
  const deleteHighlight = (id: string) => {
    setHighlights(prev => prev.filter(highlight => highlight.id !== id));
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create audio annotation
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'audio',
          content: 'Audio annotation',
          audioUrl,
          color: selectedColor.class,
          position: selectionPosition || { x: 100, y: 100, width: 150, height: 25 },
          author: { name: 'Current User' },
          createdAt: new Date(),
          highlightedText: selectedText
        };
        
        setAnnotations(prev => [...prev, newAnnotation]);
        setShowAnnotationForm(false);
        setSelectedText('');
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Add text annotation
  const addTextAnnotation = () => {
    if (!newAnnotation.trim() || !selectedText) return;

    const annotation: Annotation = {
      id: Date.now().toString(),
      type: 'text',
      content: newAnnotation,
      color: selectedColor.class,
      position: selectionPosition || { x: 100, y: 100, width: 150, height: 25 },
      author: { name: 'Current User' },
      createdAt: new Date(),
      highlightedText: selectedText
    };

    setAnnotations(prev => [...prev, annotation]);
    setNewAnnotation('');
    setShowAnnotationForm(false);
    setSelectedText('');
  };

  // Delete annotation
  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  };

  return (
    <div className="h-full flex">
      {/* PDF Viewer - Main Content */}
      <div className="flex-1 flex flex-col">
        <PDFViewer
          pdfUrl="/chord_chart_sample.pdf"
          onTextSelection={handleTextSelection}
          onHighlightCreate={handleHighlightCreate}
          annotations={annotations}
          highlights={highlights}
        />
      </div>

      {/* Annotation Sidebar - Adobe Acrobat style */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments & Highlights
          </h3>
        </div>

        {/* Annotations List */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="highlights" className="text-xs">Highlights</TabsTrigger>
                <TabsTrigger value="mine" className="text-xs">Mine</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="flex-1 p-3 space-y-3">
              {annotations.map((annotation) => (
                <div key={annotation.id} className="border border-gray-200 rounded-lg p-3 space-y-2 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${annotation.color}`} />
                      <span className="text-xs font-medium text-gray-700">{annotation.author.name}</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {annotation.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAnnotation(annotation.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    "{annotation.highlightedText}"
                  </div>
                  
                  <div className="text-sm text-gray-900">
                    {annotation.content}
                  </div>
                  
                  {annotation.type === 'audio' && annotation.audioUrl && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        <Play className="h-3 w-3 mr-1" />
                        Play
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    {annotation.createdAt.toLocaleString()}
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="highlights" className="flex-1 p-3 space-y-3">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="border border-gray-200 rounded-lg p-3 space-y-2 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${highlight.color}`} />
                      <span className="text-xs font-medium text-gray-700">{highlight.author.name}</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        highlight
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteHighlight(highlight.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    "{highlight.text}"
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {highlight.createdAt.toLocaleString()}
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="mine" className="flex-1 p-3 space-y-3">
              {annotations.filter(ann => ann.author.name === 'Current User').map((annotation) => (
                <div key={annotation.id} className="border border-gray-200 rounded-lg p-3 space-y-2 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${annotation.color}`} />
                      <span className="text-xs font-medium text-gray-700">You</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {annotation.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAnnotation(annotation.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    "{annotation.highlightedText}"
                  </div>
                  
                  <div className="text-sm text-gray-900">
                    {annotation.content}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {annotation.createdAt.toLocaleString()}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Color Selection - Compact */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Highlight Color</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.name}
                className={`w-6 h-6 rounded-full ${color.class} border-2 ${
                  selectedColor.name === color.name ? 'border-gray-800' : 'border-gray-300'
                } hover:scale-110 transition-transform`}
                onClick={() => setSelectedColor(color)}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Annotation Form Modal */}
      {showAnnotationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Annotation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Selected Text:</label>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  "{selectedText}"
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Annotation:</label>
                <Textarea
                  placeholder="Add your comment..."
                  value={newAnnotation}
                  onChange={(e) => setNewAnnotation(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={addTextAnnotation} className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Text
                </Button>
                
                <Button 
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  className="flex-1"
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Record
                    </>
                  )}
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={() => setShowAnnotationForm(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
