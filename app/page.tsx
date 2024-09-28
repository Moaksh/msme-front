"use client";
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

import { useToast } from "@/components/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"

interface Step {
    question: string;
    key: string;
    type: 'text' | 'select' | 'phone_number' | 'email';
    options?: string[];
    followUp?: string;
}

const steps: Step[] = [
    { question: "What’s your name?", key: 'name', type: 'text' },
    { question: "Great to meet you! Can you tell me your gender?", key: 'gender', type: 'select', options: ["Male", "Female", "Other"] },
    { question: "Thanks! How old are you?", key: 'age', type: 'text' },
    { question: "Which town do you live in?", key: 'town', type: 'text' },
    { question: "And your district?", key: 'district', type: 'text' },
    { question: "What is your educational qualification?", key: 'educational_qualification', type: 'text' },
    { question: "Which category do you belong to?", key: 'category', type: 'select', options: ["General", "OBC", "SC/ST", "Other"] },
    { question: "Please share your contact number.", key: 'contact_number', type: 'phone_number' },
    { question: "And your email ID?", key: 'email_id', type: 'email' },
    { question: "Is this your first business?", key: 'is_first_business', type: 'select', options: ["Yes", "No"] },
    { question: "Where is your business located?", key: 'business_location', type: 'text' },
    { question: "What sector does your business belong to?", key: 'sector', type: 'select', options: ["Manufacturing", "Services", "Trading"] },
    { question: "What type of business do you plan to start?", key: 'business_type', type: 'select', options: [
    "Leather products",
    "Moulding of items",
    "Products associated with natural fragrances and tastes",
    "Consulting, management, and placement services",
    "Educational Training Institutes",
    "Energy-saving pump manufacturers",
    "Photocopying Agencies/Centres",
    "Crèches and beauty salons",
    "Garages and auto repair services",
    "X-ray machine manufacturers",
    "Rental and leasing of equipment",
    "Photographic lab",
    "Maintenance of farm machinery for agriculture",
    "Back-office operations",
    "Local and International calling booths",
    "Low-capital retail trade enterprise",
    "Dish cable TV with multiple channels using a dish antenna",
    "Dry cleaning and laundry",
    "Hardened metal ware",
    "Electronic components for automobiles",
    "Electronic monitoring and security",
    "Engineering Mechanics",
    "Engineering and manufacturing",
    "VCRs, recorders, radios, transformers, motors, and watches",
    "Plants' micronutrients",
    "Ayurvedic items and active pharmaceutical components",
    "Products made from Khadi and Hosiery",
    "Businesses involved in crafting activities",
    "Paper printing and other paper-based products",
    "Coir Products",
    "Furniture goods",
    "Farming of poultry",
    "Bicycle components",
    "Items of stationery",
    "Contact Centre",
    "Products made of rubber",
    "IT services",
    "Industry testing laboratories",
    "Automobile companies",
    "Ceramics and glass products",
    "Retail Operations"
]
},
    { question: "Could you tell me a little about your business idea? (Brief description, max 100 words)", key: 'business_idea_brief', type: 'text' },
    { question: "Have you conducted any market research?", key: 'market_research', type: 'select', options: ["Yes", "No"], followUp: "research_summary" },
    { question: "Please provide a brief summary of your research (up to 100 words).", key: 'research_summary', type: 'text' },
    { question: "Do you have relevant skills or experience for this business?", key: 'skills_experience', type: 'select', options: ["Yes", "No"], followUp: 'skills_description' },
    { question: "Please describe your skills or experience (up to 100 words).", key: 'skills_description', type: 'text'},
    { question: "When do you plan to start your business?", key: 'timeline', type: 'select', options: ["In 3 to 6 months", "In 6 to 12 months", "After 1 year","Not yet decided"] },
    { question: "How much do you plan to invest?", key: 'investment_amount', type: 'select', options: ["Under Rs. 3 Lakh", "Rs. 3-5 Lakh", "Rs. 5-10 Lakh","Rs 10-25 Lakh"] },
    { question: "Do you have any specific milestones or goals for the first year? (Up to 100 words)", key: 'goals_description', type: 'text' },
    { question: "Do you have any concerns or questions about starting your business? (Up to 100 words)", key: 'concerns_description', type: 'text' },
];

interface UserData {
    [key: string]: string | null;
}

interface ResponseData {
    response: string;
    pdf_url: string;
}

const Home: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [userData, setUserData] = useState<UserData>({});
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [chatHistory, setChatHistory] = useState<{ question: string, answer: string }[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null); // State for error messages
    const [serverError, setServerError] = useState<boolean>(false); // State for server error messages
    const { toast } = useToast()
    const displayQuestion = steps[currentStep];

    const chatContainerRef = useRef<HTMLDivElement>(null); // Create a ref for the chat container
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
        handleSubmit(); // Call the submit function when Enter is pressed
    }
};

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { value } = e.target;
        setInputValue(value);
        setError(null); // Reset error on input change
    };

    const validateInput = (value: string) => {
        if (displayQuestion.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        }
        if (displayQuestion.type === 'phone_number') {
            const phoneRegex = /^[0-9]{10}$/; // Adjust regex as needed for your phone number format
            return phoneRegex.test(value);
        }
        return true; // For other types, we assume validity
    };

    const handleSubmit = async (isRetry = false) => {
        if (inputValue.trim() === '' && !isRetry) return;

        // Validate input
        if (!isRetry && !validateInput(inputValue)) {
            setError(`Please enter a valid ${displayQuestion.type === 'email' ? 'email' : 'phone number'}.`);
            toast({
                variant: "destructive",
                title: `Please enter a valid ${displayQuestion.type === 'email' ? 'email' : 'phone number'}.`,
            });
            return;
        }

        // Add the current input to chat history
        if (!isRetry) {
            setChatHistory(prev => [...prev, { question: displayQuestion.question, answer: inputValue }]);
        }

        // Update user data
        const updatedUserData = isRetry ? userData : { ...userData, [displayQuestion.key]: inputValue };
        setUserData(updatedUserData);
        setInputValue('');

        // Check for follow-up logic
        if (displayQuestion.followUp) {
            // If the current question has a follow-up
            if (displayQuestion.type === 'select' && inputValue === "No") {
                // If the answer is "No", skip the follow-up question
                setCurrentStep(currentStep + 2);
            } else {
                // Otherwise, just move to the next step
                setCurrentStep(currentStep + 1);
            }
        } else {
            // If it's not the last step, move to the next step
            if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                setLoading(true);

                try {
                    console.log('sending data', updatedUserData);
                    const res = await fetch('/api/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updatedUserData),
                    });

                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }

                    const data: ResponseData = await res.json();
                    console.log("API Response:", data);
                    setResponse(data);
                    setServerError(false);
                } catch (error) {
                    console.error("Error fetching data:", error);
                    setResponse({ response: "There was an error retrieving the data.", pdf_url: "" });
                    toast({
                        variant: "destructive",
                        title: "There was an error retrieving the data. Please try again.",
                    });
                    setServerError(true);
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const handleRetry = () => {
       // Reset server error state
        handleSubmit(true); // Retry sending the data
    };


    const handelRestart = () => {
        setCurrentStep(0);
        setUserData({});
        setResponse(null);
        setChatHistory([]);
        setError(null); // Reset error on restart
    }

    // Scroll to bottom effect
    useEffect(() => {
        chatContainerRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [chatHistory]); // Runs when chatHistory changes

    return (
        <div className="container p-6 flex flex-col bg-gray-100 relative min-w-full max-h-dvh">
            {/* Heading */}
            <div className="flex flex-col space-y-1.5 pb-6">
                <h2 className="font-semibold text-lg tracking-tight">MSME Business Setup in Uttar Pradesh</h2>
                <p className="text-sm text-[#6b7280] leading-3">Powered by thothica</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-2xl overflow-auto border border-[#e5e7eb] w-full flex flex-col h-dvh">

                {/* Chat Container */}
                <div
                    className="overflow-auto pr-4 max-h-[400px] flex-1" // Set a max height for scrolling
                    style={{ minWidth: '100%', display: 'table' }}
                >

                    {/* Chat Message AI */}
                    <div className="flex gap-3 my-4 text-gray-600 text-sm flex-1">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                            <div className="rounded-full bg-gray-100 border p-1">
                                <svg
                                    stroke="none"
                                    fill="black"
                                    strokeWidth="1.5"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                    height="20"
                                    width="20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                                    />
                                </svg>
                            </div>
                        </span>
                        <p className="leading-relaxed">
                            <span className="block font-bold text-gray-700">AI </span>Welcome! I'm Asha and here to help
                            you gather business
                            advice and a feasibility report for your MSME business in Uttar Pradesh. Let’s get started
                            with
                            some personal information.
                        </p>
                    </div>
                    {chatHistory.map((item, index) => (
                        <div key={index} className="flex flex-col">
                            <div className="flex gap-3 my-4 text-gray-600 text-sm flex-1">
                                <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                                    <div className="rounded-full bg-gray-100 border p-1">
                                        <svg
                                            stroke="none"
                                            fill="black"
                                            strokeWidth="1.5"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                            height="20"
                                            width="20"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                                            />
                                        </svg>
                                    </div>
                                </span>
                                <p className="leading-relaxed">
                                    <span className="block font-bold text-gray-700">AI </span>{item.question}
                                </p>
                            </div>

                            <div className="flex gap-3 my-4 text-gray-600 text-sm flex-1">
                                <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                                    <div className="rounded-full bg-gray-100 border p-1">
                                        <svg
                                            stroke="none"
                                            fill="black"
                                            strokeWidth="0"
                                            viewBox="0 0 16 16"
                                            height="20"
                                            width="20"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
                                            </svg>
                                    </div>
                                </span>
                                <p className="leading-relaxed">
                                    <span className="block font-bold text-gray-700">You </span>{item.answer}
                                </p>
                            </div>
                        </div>
                    ))}

                    {currentStep < steps.length && !loading && !response && (
                        <div className="flex gap-3 my-4 text-gray-600 text-sm flex-1" ref={chatContainerRef}>
                            <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                                <div className="rounded-full bg-gray-100 border p-1">
                                    <svg
                                        stroke="none"
                                        fill="black"
                                        strokeWidth="1.5"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                        height="20"
                                        width="20"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                                        />
                                    </svg>
                                </div>
                            </span>
                            <p className="leading-relaxed">
                                <span className="block font-bold text-gray-700">AI </span>{displayQuestion.question}
                            </p>
                        </div>
                    )}

                    {response && (
                        <div>
                            <div className="flex gap-3 my-4 text-gray-600 text-sm flex-1">
                                <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                                    <div className="rounded-full bg-gray-100 border p-1">
                                        <svg
                                            stroke="none"
                                            fill="black"
                                            strokeWidth="1.5"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                            height="20"
                                            width="20"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                                            />
                                        </svg>
                                    </div>
                                </span>
                                <p className="leading-relaxed">
                                    <span className="block font-bold text-gray-700">AI </span><ReactMarkdown>{response.response}</ReactMarkdown>
                                    {response.pdf_url && (
                                        <a
                                            href={response.pdf_url}
                                            className="text-blue-500 underline"
                                            target="_blank"
                                            rel="noopener noreferrer">
                                            Download Report
                                        </a>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input box */}
                {loading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="text-white text-xl">Generating Report...</div>
                    </div>
                )}
            </div>
            {!response ? (
                <div className="flex items-center pt-2">
                    <div className="flex items-center justify-center w-full space-x-2">
                        {displayQuestion.type === 'select' ? (
                            <select
                                className="option-select rounded-md border p-2 w-full"
                                onChange={handleInputChange}
                                value={inputValue}
                                onKeyDown={handleKeyDown}
                                disabled={currentStep >= steps.length}
                            >
                                <option value="" disabled>Select an option</option>
                                {displayQuestion.options?.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        ) : (

                            <input
                                type={displayQuestion.type === 'email' ? 'email' : 'text'}
                                className="border rounded-md p-2 w-full"
                                placeholder="Type your answer..."
                                value={inputValue}
                                onKeyDown={handleKeyDown}
                                onChange={handleInputChange}
                                disabled={currentStep >= steps.length}
                            />

                        )}
                        <button
                            onClick={() => handleSubmit()}

                            disabled={currentStep >= steps.length}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium text-[#f9fafb] disabled:pointer-events-none disabled:opacity-50 bg-black hover:bg-[#111827E6] h-10 px-4 py-2"
                        >
                            Send
                        </button>
                    </div>
                     {/* Display error message */}
                </div>
            ) : (
                <div className="flex items-center pt-2">
                    <div className="flex items-center justify-center w-full space-x-2">


                        {serverError ? (
                            <button
                                onClick={handleRetry}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium text-[#f9fafb] bg-black hover:bg-[#111827E6] h-10 px-4 py-2"
                            >
                                Check again
                            </button>
                        ): (
                            <button
                                onClick={handelRestart}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium text-[#f9fafb] bg-black hover:bg-[#111827E6] h-10 px-4 py-2"
                            >
                                Check another business
                            </button>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
