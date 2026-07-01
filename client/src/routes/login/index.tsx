import { useState } from "react";
import {
  createFileRoute,
  useNavigate,
  type HistoryState,
} from "@tanstack/react-router";
import type Character from "~/core/Character";
import LoginLayout from "~/components/layouts/Login";
import CredentialFormManager from "~/components/forms/CredentialFormManager";
import CharacterSelectionForm from "~/components/forms/CharacterSelectionForm";

export type LoginViewStep = "CREDENTIALS" | "PROFILE_SELECTION";

export const Route = createFileRoute("/login/")({
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [viewStep, setViewStep] = useState<LoginViewStep>("CREDENTIALS");
  const [authPayload, setAuthPayload] = useState<{
    playerId: number | null;
    characters: Character[];
  }>({
    playerId: null,
    characters: [],
  });
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);

  const handleAuthSuccess = (playerId: number, characters: Character[]) => {
    setAuthPayload({ playerId, characters });
    if (characters.length > 0) {
      setSelectedCharId(characters[0].id);
    }
    setViewStep("PROFILE_SELECTION");
  };

  const handleLaunchGame = () => {
    if (!selectedCharId || !authPayload.playerId) return;

    navigate({
      to: "/game",
      state: {
        playerId: authPayload.playerId,
        characterId: selectedCharId,
      } as HistoryState,
    });
  };

  return (
    <LoginLayout viewStep={viewStep}>
      {viewStep === "CREDENTIALS" ? (
        <CredentialFormManager onAuthSuccess={handleAuthSuccess} />
      ) : (
        <CharacterSelectionForm
          characters={authPayload.characters}
          selectedCharId={selectedCharId}
          onSelectCharacter={setSelectedCharId}
          onBack={() => setViewStep("CREDENTIALS")}
          onLaunch={handleLaunchGame}
        />
      )}
    </LoginLayout>
  );
}
