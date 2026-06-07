import { LoginForm } from "@/components/LoginForm";
import { Spotlight } from "@/components/ui/spotlight";


export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center  p-6 md:p-10">
        <Spotlight
                      className="-top-40 left-0   opacity-100 animate-spotlight-left"
                      fill="green"
                    />
                  
                     <Spotlight
                                  className="-top-40 left-0 md:-top-80 md:left-60 opacity-100 animate-spotlight-right"
                                  fill="white"
                                />
      <div className="w-full max-w-sm md:max-w-6xl">
       
        <LoginForm />
      </div>
    </div>
  )
}
