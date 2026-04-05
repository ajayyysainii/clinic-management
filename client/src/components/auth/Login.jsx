import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios"
import { BACKEND_URL } from "../../utils/urlConstants";
import { setAuthToken, isAuthenticated } from "../../utils/authUtils";
import { FormLoader } from "../ui/FormLoader";

const Login = () => {
    let navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated()) {
            navigate("/")
        }
    }, [navigate]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${BACKEND_URL}/users/login`, {
                email: formData.email,
                password: formData.password,
            });
            console.log(response)
            const json = response.data;
            console.log(json)

            if (json.success) {
                setAuthToken(json.data.token);
                navigate("/");
            }

        } catch (error) {
            if (error.response) {
                setError(error.response.data.message || 'Login failed');
            } else if (error.request) {
                setError('Network error - please try again');
            } else {
                setError(error.message || 'An error occurred during login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen p-6 md:p-8 lg:p-12">
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
                    {/* Left Panel */}
                    <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full">
                            <div className="flex items-center mb-8 justify-center">
                                <img
                                    className="w-40"
                                    src="https://preva.care/admin/assets/preva_logo_blue_combined-DSVjkKOP.png"
                                    alt="Preva Symbol"
                                />
                            </div>

                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
                                <p className="text-gray-600">From Diagnosis to Discharge — All in One Click</p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Form */}
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        disabled={isLoading}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                >
                                    {isLoading ? <FormLoader size="md" text="Signing In..." /> : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-8 md:p-12 lg:p-16 hidden lg:flex flex-col justify-center items-center text-white relative">
                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                                A Unified Community for a<br />
                                Healthier Outcome!
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;