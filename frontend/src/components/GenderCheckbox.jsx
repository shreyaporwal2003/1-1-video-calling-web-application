const GenderCheckbox = ({ onCheckboxChange, selectedGender }) => {
	return (
		<div style={{ display: "flex", gap: "10px", marginBottom: "12px", justifyContent: "center" }}>
			<div className="form-control">
				<label className={`label ${selectedGender === "male" ? "selected" : ""} `} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#111b21" }}>
					<span className="label-text">Male</span>
					<input
						type="checkbox"
						className="checkbox"
						checked={selectedGender === "male"}
						onChange={() => onCheckboxChange("male")}
                        style={{ cursor: "pointer" }}
					/>
				</label>
			</div>
			<div className="form-control">
				<label className={`label ${selectedGender === "female" ? "selected" : ""} `} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#111b21" }}>
					<span className="label-text">Female</span>
					<input
						type="checkbox"
						className="checkbox"
						checked={selectedGender === "female"}
						onChange={() => onCheckboxChange("female")}
                        style={{ cursor: "pointer" }}
					/>
				</label>
			</div>
		</div>
	);
};
export default GenderCheckbox;
