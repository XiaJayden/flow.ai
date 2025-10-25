import { AnnotationTestPage } from '@/components/annotations/annotation-test-page';

export default function AnnotationsTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">PDF Annotation Test</h1>
          <p className="text-sm text-gray-600 mt-1">
            Adobe Acrobat-style interface for collaborative chord chart annotations
          </p>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <AnnotationTestPage />
        </div>
      </div>
    </div>
  );
}

