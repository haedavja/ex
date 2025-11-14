import { useEffect, useMemo, useRef } from "react";
import { useGameStore } from "../../state/gameStore";

const buildBattlePayload = (battle) => {
  if (!battle) return null;
  const initialPlayer = battle.simulation?.initialState?.player;
  const initialEnemy = battle.simulation?.initialState?.enemy;
  return {
    player: {
      hp: initialPlayer?.hp ?? 30,
      maxHp: initialPlayer?.hp ?? 30,
      energy: 6,
    },
    enemy: {
      name: battle.label ?? "Enemy",
      hp: initialEnemy?.hp ?? 30,
    },
  };
};

export function LegacyBattleScreen() {
  const activeBattle = useGameStore((state) => state.activeBattle);
  const resolveBattle = useGameStore((state) => state.resolveBattle);
  const iframeRef = useRef(null);
  const payload = useMemo(() => buildBattlePayload(activeBattle), [activeBattle]);
  const frameKey = activeBattle ? `${activeBattle.nodeId}-${activeBattle.kind}` : "idle";

  const postInit = () => {
    if (!payload) return;
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    target.postMessage({ type: "battleInit", payload }, "*");
  };

  useEffect(() => {
    const handler = (event) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      console.log("[LegacyBattleScreen] Received message:", data);
      if (data.type === "battleReady") {
        console.log("[LegacyBattleScreen] Battle ready, sending init");
        postInit();
      }
      if (data.type === "battleResult") {
        console.log("[LegacyBattleScreen] Battle result:", data.result);
        const result = data.result === "victory" ? "victory" : "defeat";
        resolveBattle({ result });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [resolveBattle, payload]);

  useEffect(() => {
    if (!payload) return;
    postInit();
  }, [payload]);

  if (!activeBattle) return null;

  return (
    <div className="battle-fullscreen">
      <iframe
        key={frameKey}
        ref={iframeRef}
        title="battle"
        src="/battle.html"
        className="battle-legacy-frame"
        onLoad={postInit}
      />
    </div>
  );
}
