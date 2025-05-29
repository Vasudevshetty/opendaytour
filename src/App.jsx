import Welcome from "./Welcome";
import MapWithTour from "./MapWithTour";
import { useState } from "react";

function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {showWelcome && <Welcome onClose={() => setShowWelcome(false)} />}
      <MapWithTour />
    </div>
  );
}

export default App;
