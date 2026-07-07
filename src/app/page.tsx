import SceneClient from "@/components/space/SceneClient";
import Overlays from "@/components/ui/Overlays";

export default function Home() {
  return (
    <main className="fixed inset-0 h-full w-full overflow-hidden bg-[#05060a]">
      <SceneClient />
      <Overlays />
    </main>
  );
}
