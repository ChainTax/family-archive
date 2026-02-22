import { AlbumWizard } from "./AlbumWizard";

export const metadata = { title: "새 앨범 만들기" };

export default function NewAlbumPage() {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-8">새 앨범 만들기</h1>
      <AlbumWizard />
    </div>
  );
}
