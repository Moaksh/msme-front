"use client"
import { useState } from "react"
import { useToast } from "@/components/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"

const Home: React.FC = () => {
  const { toast } = useToast()
  const [clickCount, setClickCount] = useState(0) // State to track button clicks

  // Define the function to show the toast
  const showToast = () => {
    setClickCount((prevCount) => {
      const newCount = prevCount + 1 // Increment click count

      if (newCount === 2) {
        // Show the toast when the button is clicked twice
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request.",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        })

        // Reset the count after showing the toast
        return 0
      }

      // Return the new count
      return newCount
    })
  }

  return (
    <Button variant="outline" onClick={showToast}>
      Show Toast
    </Button>
  )

}
export default Home;
