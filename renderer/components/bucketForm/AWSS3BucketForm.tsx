import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import React from "react";
import Typography from "@mui/material/Typography";
import { useForm } from "react-hook-form";
import { BucketInfo, RegionInfoList, StorageInfo } from "#types";

interface AWSS3BucketFormProps {
  storage: StorageInfo;
  bucket: BucketInfo;
  onSave: (bucket: BucketInfo) => Promise<void>;
  onCancel: () => Promise<void>;
}

export const AWSS3BucketForm = (props: AWSS3BucketFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleOK = async (data) => {
    await props?.onSave(data);
    reset();
  };
  const handleCancel = async () => {
    await props?.onCancel();
    reset();
  };
  return (
    <form onSubmit={handleSubmit(handleOK)} noValidate>
      {props?.bucket && <DialogTitle>Edit Bucket</DialogTitle>}
      {!props?.bucket && <DialogTitle>Create Bucket</DialogTitle>}
      <DialogContent>
        <Typography>
          Specify AWS bucket name and optional parameters and click Save
        </Typography>
        <TextField
          autoFocus
          required
          margin="dense"
          id="name"
          name="name"
          label="Bucket name"
          defaultValue={props?.bucket?.name}
          type="string"
          fullWidth
          variant="standard"
          error={errors.name != null}
          {...register("name", { required: true })}
        />
        <FormControl variant="standard" sx={{ marginTop: 1, minWidth: 300 }}>
          <InputLabel id="region-label">Region</InputLabel>
          <Select
            labelId="region-label"
            id="region"
            name="region"
            defaultValue={props?.bucket?.region}
            {...register("region")}
          >
            {RegionInfoList &&
              RegionInfoList.map((item, index) => (
                <MenuItem key={index} value={item}>
                  {item}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button type="submit">Save</Button>
        <Button autoFocus onClick={handleCancel}>
          Cancel
        </Button>
      </DialogActions>
    </form>
  );
};
