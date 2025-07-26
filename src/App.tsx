import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaTrain } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
import image from "./assets/trackcircuit.png";

type SignalColor = "RED" | "YELLOW" | "DOUBLE_YELLOW" | "GREEN";

const kmCount = 6;
const signalPositions = Array.from({ length: kmCount + 1 }, (_, i) => (i * 100) / kmCount);
const blockLength = 1 / kmCount;

const signalColors: Record<SignalColor, string> = {
  RED: "bg-red-600",
  YELLOW: "bg-yellow-400",
  DOUBLE_YELLOW: "bg-yellow-200",
  GREEN: "bg-green-500",
};

interface SignalPillarProps {
  left: number;
  top: number;
  color: SignalColor;
  km: number;
  isDouble?: boolean;
  distanceTop?: number;
}

const SignalPillar: React.FC<SignalPillarProps> = ({
  left,
  top,
  color,
  km,
  isDouble = false,
  distanceTop = 0,
}) => (
  <>
    {/* Distance Label, clean/above */}
    <div
      className="absolute text-black text-xs font-bold px-2 py-1 bg-white bg-opacity-80 rounded z-30 shadow"
      style={{
        left: `calc(${left}% - 16px)`,
        top: distanceTop,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {`${km} km`}
    </div>
    {/* Pillar and lights */}
    <div
      className="absolute flex flex-col items-center z-20"
      style={{ left: `${left}%`, top }}
    >
      <div
        className="flex flex-col-reverse items-center gap-1 mb-1"
        style={isDouble ? { flexDirection: "column-reverse" } : {}}
      >
        {isDouble ? (
          <>
            <div className={`w-4 h-4 rounded-full ${signalColors[color]} shadow`} />
            <div className={`w-4 h-4 rounded-full ${signalColors[color]} shadow`} />
          </>
        ) : (
          <div className={`w-4 h-4 rounded-full ${signalColors[color]} shadow`} />
        )}
      </div>
      <div className="w-1 h-8 bg-black rounded" />
    </div>
  </>
);

export default function App() {
  const [trainPosExpress, setTrainPosExpress] = useState(0);
  const [trainPosLower1, setTrainPosLower1] = useState(0);
  const [trainPosLower2, setTrainPosLower2] = useState(0);
  const [local2Started, setLocal2Started] = useState(false);
  const [running, setRunning] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);

  // UI layout constants
  const BOX_WIDTH = 1100; // px, up to you, fits most screens
  const RAIL_Y = [180, 360]; // y positions for main tracks
  const TRACK_SPACING = 180;

  const expressSpeed = 0.0016;
  const localSpeed = 0.0016;

  // Keep all trains in bounds / moving
  useEffect(() => {
    if (!running) return;
    const idExp = setInterval(() => {
      setTrainPosExpress(pos => (pos >= 1 ? 1 : pos + expressSpeed));
    }, 35);
    const id1 = setInterval(() => {
      setTrainPosLower1(pos => (pos >= 1 ? 1 : pos + localSpeed));
    }, 35);
    return () => {
      clearInterval(idExp);
      clearInterval(id1);
    };
  }, [running]);

  // Second train waits for three-block gap
  useEffect(() => {
    if (!running || local2Started) return;
    if (trainPosLower1 >= blockLength * 3) setLocal2Started(true);
  }, [running, local2Started, trainPosLower1]);

  useEffect(() => {
    if (!running || !local2Started) return;
    const id2 = setInterval(() => {
      setTrainPosLower2(pos => (pos >= 1 ? 1 : pos + localSpeed));
    }, 35);
    return () => clearInterval(id2);
  }, [running, local2Started]);

  function handleReset() {
    setRunning(false);
    setTrainPosExpress(0);
    setTrainPosLower1(0);
    setTrainPosLower2(0);
    setLocal2Started(false);
  }

  function getExpressSignalColor(trainX: number, blockIndex: number): SignalColor {
    let currentBlock = 0;
    for (let i = 0; i < kmCount; i++) {
      const start = signalPositions[i] / 100;
      const end = signalPositions[i + 1] / 100;
      if (trainX >= start && trainX < end) {
        currentBlock = i;
        break;
      }
      if (trainX >= signalPositions[kmCount] / 100) currentBlock = kmCount;
    }
    if (blockIndex > currentBlock + 1) return "GREEN";
    if (blockIndex === currentBlock + 1) return "GREEN";

    const blockStart = signalPositions[blockIndex] / 100;
    const blockEnd = blockIndex + 1 <= kmCount ? signalPositions[blockIndex + 1] / 100 : 1;
    if (trainX >= blockStart && trainX < blockEnd) return "RED";
    if (blockIndex + 1 <= kmCount) {
      const nxtStart = signalPositions[blockIndex + 1] / 100;
      const nxtEnd = blockIndex + 2 <= kmCount ? signalPositions[blockIndex + 2] / 100 : 1;
      if (trainX >= nxtStart && trainX < nxtEnd) return "RED";
    }
    if (blockIndex + 2 <= kmCount) {
      const yBlockStart = signalPositions[blockIndex + 2] / 100;
      const yBlockEnd = blockIndex + 3 <= kmCount ? signalPositions[blockIndex + 3] / 100 : 1;
      if (trainX >= yBlockStart && trainX < yBlockEnd) return "RED";
    }
    return "RED";
  }

  function getLowerTrackSignalColor(trainPositions: number[], blockIndex: number): SignalColor {
    const lead = Math.max(...trainPositions);
    let currentBlock = 0;
    for (let i = 0; i < kmCount; i++) {
      const start = signalPositions[i] / 100;
      const end = signalPositions[i + 1] / 100;
      if (lead >= start && lead < end) {
        currentBlock = i;
        break;
      }
      if (lead >= signalPositions[kmCount] / 100) currentBlock = kmCount;
    }
    if (blockIndex > currentBlock + 1) return "RED";
    if (blockIndex === currentBlock + 1) return "GREEN";

    const blockStart = signalPositions[blockIndex] / 100;
    const blockEnd = blockIndex + 1 <= kmCount ? signalPositions[blockIndex + 1] / 100 : 1;
    if (trainPositions.some(pos => pos >= blockStart && pos < blockEnd)) return "RED";
    if (blockIndex + 1 <= kmCount) {
      const nxtStart = signalPositions[blockIndex + 1] / 100;
      const nxtEnd = blockIndex + 2 <= kmCount ? signalPositions[blockIndex + 2] / 100 : 1;
      if (trainPositions.some(pos => pos >= nxtStart && pos < nxtEnd)) return "DOUBLE_YELLOW";
    }
    if (blockIndex + 2 <= kmCount) {
      const yBlockStart = signalPositions[blockIndex + 2] / 100;
      const yBlockEnd = blockIndex + 3 <= kmCount ? signalPositions[blockIndex + 3] / 100 : 1;
      if (trainPositions.some(pos => pos >= yBlockStart && pos < yBlockEnd)) return "YELLOW";
    }
    return "GREEN";
  }

  // Rails/ties, correct proximity for compactness
  const renderTrackRails = (top: number) => {
    const railThickness = 4, tieHeight = 6, tieWidth = 14, ties = 30, tieSpacing = 100 / ties;
    return (
      <div className="absolute left-0 w-full" style={{ top }}>
        <div className="absolute bg-gray-700 rounded" style={{ height: railThickness, width: "100%", top: -7, left: 0 }} />
        <div className="absolute bg-gray-700 rounded" style={{ height: railThickness, width: "100%", top: +7, left: 0 }} />
        {[...Array(ties)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-gray-400"
            style={{
              height: tieHeight,
              width: tieWidth,
              left: `${i * tieSpacing}%`,
              top: 0,
              transform: "translateX(-50%)",
              borderRadius: 1,
            }}
          />
        ))}
      </div>
    );
  };

  const allAtStation = trainPosExpress >= 1 && trainPosLower1 >= 1 && trainPosLower2 >= 1;

  return (
    <div className="w-screen h-screen min-h-[400px] bg-gradient-to-br from-slate-800 via-gray-900 to-slate-700 flex items-center justify-center overflow-hidden pt-[250px]">
      <div
        className="relative rounded-lg shadow-2xl bg-slate-100 ring-2 ring-gray-500"
        style={{
          maxWidth: BOX_WIDTH,
          minWidth: 660,
          width: "95vw",
          height: 430 + 2 * TRACK_SPACING,
          margin: "0 auto",
          boxShadow: "0 10px 32px #1118"
        }}
      >
        <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center z-30 w-full pointer-events-none">
          <h1 className="text-xl sm:text-2xl font-bold text-black/90 mb-8">Automatic Signalling System</h1>
          <div className="flex gap-2 pointer-events-auto ">
            <button
              onClick={() => setRunning(true)}
              disabled={running || allAtStation}
              className={`bg-blue-600 hover:bg-blue-700 transition text-white font-semibold px-4 py-1.5 rounded ${running || allAtStation ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Start
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-700 transition text-white font-semibold px-4 py-1.5 rounded"
            >
              Reset
            </button>
            <button
              onClick={() => setShowDiagram(true)}
              className="bg-blue-600 hover:bg-blue-700 transition text-white font-semibold px-4 py-1.5 rounded"
            >
              Show Track Circuit Diagram
            </button>
          </div>
        </div>
        {/* Station yards */}
        <div className="absolute right-4 top-16 bg-green-700 text-white px-3 py-1 mt-5 rounded shadow font-semibold z-30 text-sm">
          Express Station Yard
        </div>
        <div
          className="absolute right-4"
          style={{ top: 16 + TRACK_SPACING }}
        >
          <div className="bg-green-700 text-white px-3 py-1 mt-15 rounded shadow font-semibold z-30 text-sm">
            Local Station Yard
          </div>
        </div>
        {/* Express track */}
        {renderTrackRails(RAIL_Y[0])}
        {/* Signal pillars and distance for express */}
        {signalPositions.map((left, i) => (
          <SignalPillar
            key={`express-${i}`}
            left={left}
            top={RAIL_Y[0] - 37}
            color={getExpressSignalColor(trainPosExpress, i)}
            km={i}
            isDouble={getExpressSignalColor(trainPosExpress, i) === "DOUBLE_YELLOW"}
            distanceTop={RAIL_Y[0] - 65}
          />
        ))}
        <motion.div
          style={{ left: 0, position: "absolute", top: RAIL_Y[0] + 2 }}
          animate={{ left: `${trainPosExpress * 100}%` }}
          transition={{ ease: "linear", duration: 0.1 }}
          className="z-30"
        >
          <FaTrain className="text-red-600 text-3xl drop-shadow" />
        </motion.div>
        {/* Lower track */}
        {renderTrackRails(RAIL_Y[1])}
        {signalPositions.map((left, i) => (
          <SignalPillar
            key={`local-${i}`}
            left={left}
            top={RAIL_Y[1] - 37}
            color={getLowerTrackSignalColor([trainPosLower1, trainPosLower2], i)}
            km={i}
            isDouble={getLowerTrackSignalColor([trainPosLower1, trainPosLower2], i) === "DOUBLE_YELLOW"}
            distanceTop={RAIL_Y[1] - 65}
          />
        ))}
        <motion.div
          style={{ left: 0, position: "absolute", top: RAIL_Y[1] + 2 }}
          animate={{ left: `${trainPosLower1 * 100}%` }}
          transition={{ ease: "linear", duration: 0.1 }}
          className="z-30"
        >
          <FaTrain className="text-blue-600 text-3xl drop-shadow" />
        </motion.div>
        <motion.div
          style={{ left: 0, position: "absolute", top: RAIL_Y[1] + 2 }}
          animate={{ left: `${trainPosLower2 * 100}%` }}
          transition={{ ease: "linear", duration: 0.1 }}
          className="z-30"
        >
          <FaTrain className="text-green-600 text-3xl drop-shadow" />
        </motion.div>
        {/* Diagram Modal */}
        {showDiagram && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <button
              onClick={() => setShowDiagram(false)}
              className="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-700 rounded-full p-2"
              title="Close Diagram"
            >
              <AiOutlineClose size={24} />
            </button>
            <img
              src={image}
              alt="Track Circuit Diagram"
              className="max-w-full max-h-[70vh] rounded shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
