import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../hooks/useSettings";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { SettingContainer } from "../ui/SettingContainer";

interface CustomWordsProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
}

export const CustomWords: React.FC<CustomWordsProps> = React.memo(
  ({ descriptionMode = "tooltip", grouped = false }) => {
    const { t } = useTranslation();
    const { getSetting, updateSetting, isUpdating } = useSettings();
    const [newWord, setNewWord] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const customWords = getSetting("custom_words") || [];

    const handleAddWord = async () => {
      setError(null);
      const trimmedWord = newWord.trim();
      const sanitizedWord = trimmedWord.replace(/[<>"'&]/g, "");

      if (
        sanitizedWord &&
        !sanitizedWord.includes(" ") &&
        sanitizedWord.length <= 50 &&
        !customWords.includes(sanitizedWord)
      ) {
        try {
          setIsLoading(true);
          await updateSetting("custom_words", [...customWords, sanitizedWord]);
          setNewWord("");
        } catch (err: any) {
          console.error("Failed to add custom word:", err);
          setError(
            err.message ||
              t("errors.failedToSaveSettings") ||
              "Failed to save settings",
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

    const handleRemoveWord = async (wordToRemove: string) => {
      setError(null);
      try {
        await updateSetting(
          "custom_words",
          customWords.filter((word) => word !== wordToRemove),
        );
      } catch (err: any) {
        console.error("Failed to remove custom word:", err);
        setError(
          err.message ||
            t("errors.failedToSaveSettings") ||
            "Failed to save settings",
        );
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddWord();
      }
    };

    return (
      <>
        <SettingContainer
          title={t("settings.advanced.customWords.title")}
          description={t("settings.advanced.customWords.description")}
          descriptionMode={descriptionMode}
          grouped={grouped}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                className="max-w-40"
                value={newWord}
                onChange={(e) => {
                  setNewWord(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyPress}
                placeholder={t("settings.advanced.customWords.placeholder")}
                variant="compact"
                disabled={isUpdating("custom_words") || isLoading}
              />
              <Button
                onClick={handleAddWord}
                disabled={
                  !newWord.trim() ||
                  newWord.includes(" ") ||
                  newWord.trim().length > 50 ||
                  isUpdating("custom_words") ||
                  isLoading
                }
                variant="primary"
                size="md"
              >
                {isLoading ? "..." : t("settings.advanced.customWords.add")}
              </Button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </SettingContainer>
        {customWords.length > 0 && (
          <div
            className={`px-4 p-2 ${grouped ? "" : "rounded-lg border border-mid-gray/20"} flex flex-wrap gap-1`}
          >
            {customWords.map((word) => (
              <Button
                key={word}
                onClick={() => handleRemoveWord(word)}
                disabled={isUpdating("custom_words")}
                variant="secondary"
                size="sm"
                className="inline-flex items-center gap-1 cursor-pointer"
                aria-label={t("settings.advanced.customWords.remove", { word })}
              >
                <span>{word}</span>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            ))}
          </div>
        )}
      </>
    );
  },
);
