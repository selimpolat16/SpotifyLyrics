import MainLayout from '@/layouts/MainLayout'

export default function Home() {
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">
          Spotify Real-Time Lyrics
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Şarkı kartları buraya gelecek */}
          <div className="bg-card rounded-lg p-4">
            <div className="aspect-square bg-muted rounded-md mb-4" />
            <h3 className="font-semibold mb-1">Şarkı Adı</h3>
            <p className="text-muted-foreground">Sanatçı</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
