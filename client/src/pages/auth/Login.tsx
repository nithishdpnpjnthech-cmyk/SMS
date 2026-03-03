import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const username = formData.get("email") as string;
      const password = formData.get("password") as string;

      await login({ username, password });

      // Auth context will handle role-based redirect
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      switch (user.role) {
        case "admin":
          setLocation("/dashboard");
          break;
        case "manager":
          setLocation("/dashboard/manager");
          break;
        case "receptionist":
          setLocation("/dashboard/receptionist");
          break;
        case "trainer":
          setLocation("/dashboard/trainer");
          break;
        default:
          setLocation("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Link href="/">
              <div className="h-20 w-20 flex items-center justify-center rounded-full overflow-hidden cursor-pointer hover:scale-105 transition-transform">
                <img src="/logo.png" alt="HUURA" className="h-full w-full object-contain" />
              </div>
            </Link>
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Login to continue</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <Label>Username</Label>
              <Input name="email" placeholder="admin" required />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">Remember me</span>
            </div>

            <Button className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setLocation('/student/login')}
              className="text-sm text-muted-foreground"
            >
              Student Portal →
            </Button>
          </div>
        </CardContent>

        <CardFooter className="text-xs text-center flex justify-center w-full">
          HUURA ACADEMY Security
        </CardFooter>
      </Card>
    </div>
  );
}
