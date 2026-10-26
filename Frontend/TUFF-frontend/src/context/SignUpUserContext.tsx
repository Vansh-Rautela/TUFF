import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ColorAnalysisResult } from '@/types/fashion';

export interface SignUpUserData {
  name?: string;
  dob?: { day: number; month: number; year: number };
  gender?: string;
  username?: string;
  bodyType?: string;
  brands?: string[];
  colorAnalysisResult?: ColorAnalysisResult | null;
  photo?: File | null;
}

interface SignUpUserContextType {
  userData: SignUpUserData;
  setUserData: (data: Partial<SignUpUserData>) => void;
  resetUserData: () => void;
  generateLLMPrompt: () => string;
}

const SignUpUserContext = createContext<SignUpUserContextType | undefined>(undefined);

export const SignUpUserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserDataState] = useState<SignUpUserData>({});

  const setUserData = (data: Partial<SignUpUserData>) => {
    setUserDataState(prev => ({ ...prev, ...data }));
  };

  const resetUserData = () => setUserDataState({});

  // Utility: summarize the profile for an LLM. Contains personal data (name,
  // date of birth): never send it to retailer search or other third parties.
  const generateLLMPrompt = () => {
    const { name, dob, gender, username, bodyType, brands, colorAnalysisResult } = userData;
    let prompt = `User Profile for Personalized Fashion Product Search:\n`;
    if (name) prompt += `- Name: ${name}\n`;
    if (dob) prompt += `- Date of Birth: ${dob.day}/${dob.month + 1}/${dob.year}\n`;
    if (gender) prompt += `- Gender: ${gender}\n`;
    if (username) prompt += `- Username: ${username}\n`;
    if (bodyType) prompt += `- Body Type: ${bodyType}\n`;
    if (brands && brands.length) prompt += `- Favorite Brands: ${brands.join(", ")}\n`;
    if (colorAnalysisResult) {
      prompt += `- Color Analysis: ${typeof colorAnalysisResult === 'string' ? colorAnalysisResult : JSON.stringify(colorAnalysisResult)}\n`;
    }
    prompt += `\nSearch for fashion products that best match the user's preferences, body type, and color analysis. Only use the selected brands/websites.`;
    return prompt;
  };

  return (
    <SignUpUserContext.Provider value={{ userData, setUserData, resetUserData, generateLLMPrompt }}>
      {children}
    </SignUpUserContext.Provider>
  );
};

export const useSignUpUser = () => {
  const context = useContext(SignUpUserContext);
  if (!context) throw new Error('useSignUpUser must be used within a SignUpUserProvider');
  return context;
};
