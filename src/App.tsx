import "./App.css";
import { JustifiedGrid } from "./JustifiedGrid";
import sample_images from "./sample_images.json";

function App() {
  return (
    <main>
      <JustifiedGrid images={sample_images} />
    </main>
  );
}

export default App;