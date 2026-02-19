import { useState } from "react";
import GenderCheckbox from "../components/GenderCheckbox";
import { Link } from "react-router-dom";
import useSignup from "../hooks/useSignup";

const SignUp = () => {
	const [inputs, setInputs] = useState({
		fullName: "",
		username: "",
		password: "",
		confirmPassword: "",
		gender: "",
	});

	const { loading, signup } = useSignup();

	const handleCheckboxChange = (gender) => {
		setInputs({ ...inputs, gender });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		await signup(inputs);
	};

	return (
		<div className="prejoin-container">
			<div className="prejoin-card" style={{ width: "400px" }}>
				<h1 style={{ fontSize: "24px", marginBottom: "20px", color: "#111b21" }}>Sign Up</h1>

				<form onSubmit={handleSubmit}>
					<div>
						<input
							type="text"
							placeholder="Full Name"
							className="room-input"
							value={inputs.fullName}
							onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })}
						/>
					</div>

					<div>
						<input
							type="text"
							placeholder="Username"
							className="room-input"
							value={inputs.username}
							onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
						/>
					</div>

					<div>
						<input
							type="password"
							placeholder="Password"
                            className="room-input"
							value={inputs.password}
							onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
						/>
					</div>

					<div>
						<input
							type="password"
							placeholder="Confirm Password"
							className="room-input"
							value={inputs.confirmPassword}
							onChange={(e) => setInputs({ ...inputs, confirmPassword: e.target.value })}
						/>
					</div>

					<GenderCheckbox onCheckboxChange={handleCheckboxChange} selectedGender={inputs.gender} />

					<Link to="/login" style={{ display: "block", marginBottom: "15px", fontSize: "14px", color: "#007bff" }}>
						Already have an account?
					</Link>

					<div>
						<button className="join-btn" disabled={loading}>
							{loading ? <span className="loading-spinner"></span> : "Sign Up"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
export default SignUp;
